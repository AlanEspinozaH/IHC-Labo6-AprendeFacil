import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { db } from './db.js';


const app = express();
const PORT = 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const audioCacheDir = path.join(__dirname, 'audio-cache');
fs.mkdirSync(audioCacheDir, { recursive: true });

app.use(cors());
app.use(express.json());
app.use('/audio-cache', express.static(audioCacheDir));

function ensureStudent(studentId) {
    db.prepare(`
        INSERT OR IGNORE INTO students (id, name)
        VALUES (?, ?)
    `).run(studentId, 'Estudiante demo');

    db.prepare(`
        INSERT OR IGNORE INTO learner_model (student_id)
        VALUES (?)
    `).run(studentId);
}

app.get('/api/progress/:studentId', (req, res) => {
    const { studentId } = req.params;
    ensureStudent(studentId);

    const model = db.prepare(`
        SELECT * FROM learner_model WHERE student_id = ?
    `).get(studentId);

    const progressRows = db.prepare(`
        SELECT node_id, completed, quiz_score, diagnostic_level
        FROM learning_progress
        WHERE student_id = ?
    `).all(studentId);

    const completed = {};
    const quizScores = {};

    for (const row of progressRows) {
        completed[row.node_id] = Boolean(row.completed);
        quizScores[row.node_id] = row.quiz_score || 0;
    }

    res.json({
        learningGoal: model.learning_goal || '',
        priorKnowledge: model.prior_knowledge || '',
        diagnosticNote: model.diagnostic_note || '',
        diagnosticLevel: progressRows[0]?.diagnostic_level || 'pendiente',
        sharedCount: model.shared_count || 0,
        completed,
        quizScores,
        quizHistory: [],
        strengths: [],
        weaknesses: []
    });
});

app.post('/api/progress/:studentId', (req, res) => {
    const { studentId } = req.params;
    const progress = req.body;
    ensureStudent(studentId);

    db.prepare(`
        UPDATE learner_model
        SET learning_goal = ?,
            prior_knowledge = ?,
            diagnostic_note = ?,
            shared_count = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE student_id = ?
    `).run(
        progress.learningGoal || '',
        progress.priorKnowledge || '',
        progress.diagnosticNote || '',
        Number(progress.sharedCount || 0),
        studentId
    );

    const upsertProgress = db.prepare(`
        INSERT INTO learning_progress
        (student_id, node_id, completed, quiz_score, diagnostic_level, updated_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(student_id, node_id)
        DO UPDATE SET
            completed = excluded.completed,
            quiz_score = excluded.quiz_score,
            diagnostic_level = excluded.diagnostic_level,
            updated_at = CURRENT_TIMESTAMP
    `);

    const nodeIds = new Set([
        ...Object.keys(progress.completed || {}),
        ...Object.keys(progress.quizScores || {})
    ]);

    for (const nodeId of nodeIds) {
        upsertProgress.run(
            studentId,
            nodeId,
            progress.completed?.[nodeId] ? 1 : 0,
            Number(progress.quizScores?.[nodeId] || 0),
            progress.diagnosticLevel || 'pendiente'
        );
    }

    res.json({ ok: true });
});

app.get('/api/voice-profiles', (req, res) => {
    const profiles = db.prepare(`
        SELECT code, name, willingness, style, manner, mood, rate, pitch, prompt_rules
        FROM voice_profiles
        ORDER BY code
    `).all();

    res.json(profiles);
});

function cleanTextForTts(text) {
    return String(text || '')
        .replace(/[*_#>`]/g, '')
        .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 1800);
}

function getVoiceSettings(profileCode) {
    const settingsByProfile = {
        tutor: {
            stability: 0.62,
            similarity_boost: 0.82,
            style: 0.18,
            speed: 0.94,
            use_speaker_boost: true
        },
        coach: {
            stability: 0.52,
            similarity_boost: 0.80,
            style: 0.35,
            speed: 0.98,
            use_speaker_boost: true
        },
        formal: {
            stability: 0.75,
            similarity_boost: 0.85,
            style: 0.10,
            speed: 0.90,
            use_speaker_boost: true
        },
        simple: {
            stability: 0.70,
            similarity_boost: 0.82,
            style: 0.12,
            speed: 0.88,
            use_speaker_boost: true
        }
    };

    return settingsByProfile[profileCode] || settingsByProfile.tutor;
}

app.post('/api/tts', async (req, res) => {
    try {
        const { text, voiceProfileCode = 'tutor' } = req.body;

        const cleanedText = cleanTextForTts(text);

        if (!cleanedText) {
            return res.status(400).json({
                ok: false,
                error: 'Texto vacío para TTS.'
            });
        }

        const apiKey = process.env.ELEVENLABS_API_KEY;
        const voiceId = process.env.ELEVENLABS_VOICE_ID;
        const modelId = process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';

        if (!apiKey || !voiceId) {
            return res.status(500).json({
                ok: false,
                provider: 'elevenlabs',
                providerCode: 'missing_env',
                error: 'Falta ELEVENLABS_API_KEY o ELEVENLABS_VOICE_ID en backend/.env.'
            });
        }

        const hashInput = JSON.stringify({
            provider: 'elevenlabs',
            modelId,
            voiceId,
            voiceProfileCode,
            text: cleanedText
        });

        const textHash = crypto
            .createHash('sha256')
            .update(hashInput)
            .digest('hex');

        const cached = db.prepare(`
            SELECT audio_path
            FROM tts_cache
            WHERE text_hash = ?
        `).get(textHash);

        if (cached) {
            return res.json({
                ok: true,
                cached: true,
                audioUrl: `/${cached.audio_path}`
            });
        }

        const response = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
            {
                method: 'POST',
                headers: {
                    'xi-api-key': apiKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: cleanedText,
                    model_id: modelId,
                    language_code: 'es',
                    voice_settings: getVoiceSettings(voiceProfileCode)
                })
            }
        );

        if (!response.ok) {
            const errorText = await response.text();

            let providerPayload = null;

            try {
                providerPayload = JSON.parse(errorText);
            } catch {
                providerPayload = null;
            }

            const providerCode =
                providerPayload?.detail?.code ||
                providerPayload?.code ||
                'provider_error';

            const providerMessage =
                providerPayload?.detail?.message ||
                providerPayload?.message ||
                errorText;

            console.error('Error del proveedor ElevenLabs:', {
                status: response.status,
                providerCode,
                providerMessage
            });

            return res.status(response.status).json({
                ok: false,
                provider: 'elevenlabs',
                providerStatus: response.status,
                providerCode,
                error: providerMessage
            });
        }

        const audioBuffer = Buffer.from(await response.arrayBuffer());
        const fileName = `${textHash}.mp3`;
        const audioPath = path.join(audioCacheDir, fileName);

        fs.writeFileSync(audioPath, audioBuffer);

        const publicPath = `audio-cache/${fileName}`;

        db.prepare(`
            INSERT OR IGNORE INTO tts_cache
            (text_hash, voice_profile_code, audio_path)
            VALUES (?, ?, ?)
        `).run(textHash, voiceProfileCode, publicPath);

        res.json({
            ok: true,
            cached: false,
            audioUrl: `/${publicPath}`
        });
    } catch (error) {
        console.error('Error en /api/tts:', error);

        res.status(500).json({
            ok: false,
            provider: 'elevenlabs',
            providerCode: 'backend_error',
            error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`Backend Aprende Fácil activo en http://localhost:${PORT}`);
});