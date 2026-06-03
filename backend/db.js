import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'aprende_facil.sqlite');
const schemaPath = path.join(__dirname, 'schema.sql');

export const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);

db.prepare(`
    INSERT OR IGNORE INTO students (id, name)
    VALUES ('demo-student', 'Estudiante demo')
`).run();

db.prepare(`
    INSERT OR IGNORE INTO learner_model (student_id)
    VALUES ('demo-student')
`).run();

const insertProfile = db.prepare(`
    INSERT OR IGNORE INTO voice_profiles
    (code, name, willingness, style, manner, mood, rate, pitch, prompt_rules)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

insertProfile.run(
    'tutor',
    'Tutor claro',
    'cauteloso',
    'cortés',
    'considerado',
    'positivo moderado',
    0.92,
    1.0,
    'Habla como tutor universitario. Usa frases breves. Corrige errores con respeto. No exageres capacidades del MVP.'
);

insertProfile.run(
    'coach',
    'Coach motivador',
    'orientador',
    'cercano',
    'motivador',
    'positivo',
    0.96,
    1.05,
    'Refuerza el avance sin exagerar. Propón una acción concreta al final.'
);

insertProfile.run(
    'formal',
    'Formal académico',
    'prudente',
    'formal',
    'preciso',
    'neutral',
    0.88,
    0.95,
    'Usa terminología correcta de IHC. Evita bromas, emojis y afirmaciones no implementadas.'
);

insertProfile.run(
    'simple',
    'Modo simple',
    'paciente',
    'simple',
    'accesible',
    'calmado',
    0.85,
    1.0,
    'Usa oraciones cortas. Explica un solo concepto por turno. Evita tecnicismos innecesarios.'
);