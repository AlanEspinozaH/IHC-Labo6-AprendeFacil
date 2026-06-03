import express from 'express';
import cors from 'cors';
import { db } from './db.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

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

app.listen(PORT, () => {
    console.log(`Backend Aprende Fácil activo en http://localhost:${PORT}`);
});