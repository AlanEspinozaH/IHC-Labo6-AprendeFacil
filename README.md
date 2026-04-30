# Aprende Fácil - Constelación 3D de Aprendizaje
### CC451 - Interacción Humano Computadora | Laboratorio 06

Aplicación web interactiva que adapta el proyecto **Aprende Fácil** a una interfaz gráfica no convencional: una constelación 3D de conceptos de aprendizaje. Cada nodo representa un concepto, módulo o necesidad de accesibilidad del sistema. Las conexiones representan relaciones de prerrequisito, dependencia o refuerzo pedagógico.

## Objetivo

Explorar una variante de interfaz inteligente para Aprende Fácil donde el estudiante pueda navegar conceptos, brechas de conocimiento, actividades de repaso y agentes LLM mediante una visualización 3D interactiva.

## Funcionalidades

- Espiral 3D de progreso de aprendizaje con 15 nodos.
- Nodos luminosos con halo y animación.
- Navegación orbital: zoom, rotación y paneo.
- Tooltips con descripción del concepto.
- Conexiones de dependencia conceptual que aparecen al acercar la cámara.
- Botón para mostrar u ocultar todas las relaciones.
- Filtro por categoría: conceptos, interfaces, evaluación, accesibilidad y gamificación.
- Búsqueda de nodos por nombre, categoría o resumen.
- Chat con agentes de aprendizaje mediante Gemini API.
- Memoria de conversación por agente.

## Categorías usadas

| Categoría | Significado |
|---|---|
| Conceptos | Fundamentos, usabilidad, carga cognitiva, extracción de conceptos |
| Interfaces | Voz, agente LLM contextual, mapa de conocimiento 3D |
| Evaluación | Flashcards, cuestionarios, dashboard de brechas |
| Accesibilidad | TTS, modo simple, accesibilidad general |
| Gamificación | Puntos, rachas e insignias |

## Agentes LLM incluidos

La aplicación conserva el patrón de `prompt_personaje` del laboratorio, pero lo adapta a agentes educativos:

- Tutor Conceptual
- Evaluador de Usabilidad
- Asistente de Accesibilidad
- Agente de Voz
- Tutor LLM Contextual
- Extractor de Conceptos
- Generador de Flashcards
- Evaluador de Brechas
- Coach de Repaso
- Diseñador de Gamificación

Cada prompt incluye reglas de comportamiento, límites de alcance y estilo de comunicación.

## Ejecutar localmente

El proyecto usa ES6 Modules, por lo que debe abrirse con un servidor HTTP local.

### Opción 1 (Windows 11): Python

```bash
cd ubicación-del-proyecto
python -m http.server 8080
```

Luego abrir el navegador y pegar esta url:

```text
http://localhost:8080
```

### Opción 2 (distri. Linux - Ubuntu): Python3

```bash
cd ubicación-del-proyecto
python3 -m http.server 8080 --bind 127.0.0.1
```

Luego abrir un navegador web y poner esta url:

```text
http://127.0.0.1:8080
```

### Opción 3: VS Code + Live Server

1. Abrir la carpeta del proyecto en VS Code.
2. Instalar la extensión **Live Server**.
3. Click derecho en `index.html`.
4. Elegir **Open with Live Server**.

## API Key de Gemini

Al abrir la aplicación, aparecerá un modal para ingresar la API key de Gemini. Es importante seleccionar "*Guardar* la api" si se quiere probar el modelo.  La clave se guarda en `localStorage` del navegador y no se sube al repositorio.

No subas claves reales a GitHub.

## Estructura del proyecto

```text
aprende-facil-lab06-corregido/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── main.js
│   ├── data.js
│   └── llm-client.js
├── screenshots/
├── docs/
├── .gitignore
├── LICENSE
└── README.md
```

