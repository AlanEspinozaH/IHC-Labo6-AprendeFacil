// ============================================
// Aprende Fácil - Datos del MVP PC02
// Flujo: diagnóstico → ruta → aprendizaje → práctica → evaluación → retroalimentación
// ============================================

const BASE_RULES = `
REGLAS GENERALES DEL AGENTE:
- Responde como apoyo académico dentro del prototipo Aprende Fácil.
- Usa lenguaje claro para estudiantes universitarios.
- No prometas funciones no implementadas: no hay backend, login, LMS real ni colaboración en tiempo real.
- Si algo es simulado en el MVP, dilo explícitamente.
- Prioriza explicaciones breves, orientación práctica y prevención de errores.
- Si la pregunta es ambigua, pide una aclaración corta.
`;

export const MAIN_FLOW_NODE_IDS = [
    'diagnostico-inicial',
    'ruta-sugerida',
    'aprendizaje-adaptativo',
    'practica-guiada',
    'evaluacion-quiz',
    'retroalimentacion-refuerzo'
];

export const learningData = {
    events: [
        {
            id: 'diagnostico-inicial',
            nombre: 'Diagnóstico inicial',
            orden: 1,
            categoria: 'evaluacion',
            nivel: 'Inicio',
            importancia: 10,
            modulo: 'Personalización continua',
            agente: 'Tutor Diagnóstico',
            resumen: 'Identifica conocimientos previos y nivel inicial del estudiante para orientar la ruta de aprendizaje.',
            ayuda: 'Empieza aquí. Este nodo simula una prueba de entrada y registra el punto de partida en localStorage.',
            conexiones: ['ruta-sugerida'],
            quiz: {
                question: '¿Cuál es el objetivo principal del diagnóstico inicial?',
                options: [
                    'Decorar la interfaz con más efectos visuales',
                    'Identificar el punto de partida del estudiante',
                    'Reemplazar totalmente al docente',
                    'Crear una cuenta de usuario en un servidor'
                ],
                correctIndex: 1,
                success: 'Correcto. El diagnóstico ayuda a personalizar la ruta sin afirmar que mide el aprendizaje de forma definitiva.',
                error: 'No exactamente. En este MVP, el diagnóstico sirve para estimar un punto de partida y sugerir una ruta.'
            },
            prompt_personaje: `Eres Tutor Diagnóstico de Aprende Fácil.
Tu foco es ayudar al estudiante a reconocer su nivel inicial, errores comunes y objetivos de aprendizaje.
${BASE_RULES}
FORMATO: diagnóstico breve, pregunta de aclaración si falta información y recomendación concreta.`,
            avatar: 'https://placehold.co/80x80/f39c12/ffffff?text=DIAG'
        },
        {
            id: 'ruta-sugerida',
            nombre: 'Ruta sugerida',
            orden: 2,
            categoria: 'concepto',
            nivel: 'Planificación',
            importancia: 9,
            modulo: 'Personalización continua',
            agente: 'Tutor Conceptual',
            resumen: 'Presenta una secuencia recomendada de nodos según el diagnóstico y el avance registrado.',
            ayuda: 'Revisa la ruta antes de saltar a la práctica. La línea principal reduce carga cognitiva frente a una exploración libre.',
            conexiones: ['aprendizaje-adaptativo'],
            quiz: {
                question: '¿Por qué la vista lineal es la principal en PC02?',
                options: [
                    'Porque elimina por completo la navegación 3D',
                    'Porque representa mejor el aprendizaje secuencial y reduce carga cognitiva',
                    'Porque impide usar filtros y búsqueda',
                    'Porque obliga a usar API de Gemini'
                ],
                correctIndex: 1,
                success: 'Correcto. La línea conserva la interfaz no convencional, pero hace más defendible el flujo de aprendizaje.',
                error: 'Revisa la decisión de diseño: la línea se usa como guía principal, mientras la espiral queda como modo exploratorio.'
            },
            prompt_personaje: `Eres Tutor Conceptual de Aprende Fácil.
Tu foco es explicar por qué una ruta de aprendizaje debe ordenar objetivos, actividades y retroalimentación.
${BASE_RULES}
FORMATO: idea central, ejemplo breve y sugerencia de siguiente paso.`,
            avatar: 'https://placehold.co/80x80/3498db/ffffff?text=RUTA'
        },
        {
            id: 'aprendizaje-adaptativo',
            nombre: 'Aprendizaje adaptativo',
            orden: 3,
            categoria: 'concepto',
            nivel: 'Desarrollo',
            importancia: 9,
            modulo: 'Personalización continua',
            agente: 'Tutor Conceptual',
            resumen: 'Explica el contenido con apoyo contextual y ajusta la recomendación según progreso y respuestas del estudiante.',
            ayuda: 'Usa el chat si necesitas explicación adicional. El ajuste es simulado y se basa en progreso local, no en analítica avanzada.',
            conexiones: ['practica-guiada'],
            quiz: {
                question: 'En este MVP, ¿qué dato se usa para personalizar el avance?',
                options: [
                    'Datos biométricos reales',
                    'Progreso y resultados guardados en localStorage',
                    'Historial académico oficial de la universidad',
                    'Reconocimiento facial'
                ],
                correctIndex: 1,
                success: 'Correcto. La personalización es local, simple y defendible para un MVP.',
                error: 'No. La personalización implementada es mínima: progreso, quiz y estado visual guardados localmente.'
            },
            prompt_personaje: `Eres Tutor Conceptual de Aprende Fácil.
Tu foco es explicar conceptos de IHC, accesibilidad y aprendizaje adaptativo sin exagerar las capacidades del prototipo.
${BASE_RULES}
FORMATO: explicación breve, ejemplo universitario y advertencia de limitación si aplica.`,
            avatar: 'https://placehold.co/80x80/3498db/ffffff?text=APRE'
        },
        {
            id: 'practica-guiada',
            nombre: 'Práctica guiada',
            orden: 4,
            categoria: 'interfaz',
            nivel: 'Aplicación',
            importancia: 8,
            modulo: 'Interfaz de voz y apoyo contextual',
            agente: 'Coach de Práctica',
            resumen: 'Propone actividades cortas, acompañadas por instrucciones, ayuda contextual, dictado y lectura en voz alta.',
            ayuda: 'Prueba el dictado o la lectura en voz alta dentro del chat. En Firefox puede variar el soporte de reconocimiento de voz.',
            conexiones: ['evaluacion-quiz'],
            quiz: {
                question: '¿Qué principio de IHC se refuerza al bloquear el envío mientras el agente responde?',
                options: [
                    'Prevención de errores y visibilidad del estado del sistema',
                    'Ocultar el estado interno al usuario',
                    'Aumentar llamadas duplicadas a la API',
                    'Eliminar la recuperación ante errores'
                ],
                correctIndex: 0,
                success: 'Correcto. Bloquear controles durante una operación evita doble envío y comunica que el sistema está procesando.',
                error: 'La idea clave es prevenir errores y mostrar estado. Eso también reduce consumo innecesario de cuota.'
            },
            prompt_personaje: `Eres Coach de Práctica de Aprende Fácil.
Tu foco es convertir conceptos en ejercicios cortos y guiar al estudiante paso a paso.
${BASE_RULES}
FORMATO: tarea concreta, criterio de éxito y retroalimentación breve.`,
            avatar: 'https://placehold.co/80x80/2ecc71/ffffff?text=PRAC'
        },
        {
            id: 'evaluacion-quiz',
            nombre: 'Evaluación / Quiz',
            orden: 5,
            categoria: 'evaluacion',
            nivel: 'Comprobación',
            importancia: 10,
            modulo: 'Gamificación',
            agente: 'Evaluador',
            resumen: 'Valida comprensión mediante un mini quiz local, puntaje e insignia de avance.',
            ayuda: 'Resuelve el mini quiz para generar puntaje. Esto implementa gamificación básica sin depender del LLM.',
            conexiones: ['retroalimentacion-refuerzo'],
            quiz: {
                question: '¿Qué módulo de la rúbrica queda cubierto por puntaje, progreso e insignias?',
                options: [
                    'Interfaces hápticas',
                    'Gamificación',
                    'Autenticación con backend',
                    'Base de datos distribuida'
                ],
                correctIndex: 1,
                success: 'Correcto. El MVP usa gamificación simple: quiz, puntaje, progreso e insignias.',
                error: 'No. Puntaje, progreso e insignias corresponden al módulo de gamificación.'
            },
            prompt_personaje: `Eres Evaluador de Aprende Fácil.
Tu foco es formular preguntas de repaso, explicar respuestas y sugerir refuerzo sin ser punitivo.
${BASE_RULES}
FORMATO: pregunta, respuesta esperada, explicación corta y recomendación.`,
            avatar: 'https://placehold.co/80x80/f39c12/ffffff?text=QUIZ'
        },
        {
            id: 'retroalimentacion-refuerzo',
            nombre: 'Retroalimentación y refuerzo',
            orden: 6,
            categoria: 'gamificacion',
            nivel: 'Cierre',
            importancia: 9,
            modulo: 'Interactividad simulada',
            agente: 'Asistente de Accesibilidad/Voz',
            resumen: 'Entrega una recomendación final, permite compartir el avance y refuerza accesibilidad mediante voz y ayuda contextual.',
            ayuda: 'Usa “Compartir avance” para generar un mensaje simulado para un compañero. No hay colaboración real ni backend.',
            conexiones: [],
            quiz: {
                question: '¿Cómo se implementa la interactividad con otros usuarios en este MVP?',
                options: [
                    'Chat en tiempo real con WebSocket',
                    'Botón que genera un mensaje de avance o reto para compartir',
                    'Login con Firebase',
                    'Videollamada integrada'
                ],
                correctIndex: 1,
                success: 'Correcto. Es una simulación honesta de interactividad, suficiente para MVP si se documenta claramente.',
                error: 'La interactividad implementada no es en tiempo real; es un mensaje generado para compartir avance o reto.'
            },
            prompt_personaje: `Eres Asistente de Accesibilidad/Voz de Aprende Fácil.
Tu foco es adaptar explicaciones, sugerir lectura en voz alta y reducir carga visual o cognitiva.
${BASE_RULES}
FORMATO: recomendación breve, ajuste accesible y limitación del prototipo.`,
            avatar: 'https://placehold.co/80x80/9b59b6/ffffff?text=A11Y'
        }
    ]
};
