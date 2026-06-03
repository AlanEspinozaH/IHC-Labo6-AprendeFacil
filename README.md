# Aprende Fácil - Constelación 3D de Aprendizaje
### CC451 - Interacción Humano Computadora | Laboratorio 06

Aplicación web interactiva que adapta el proyecto **Aprende Fácil** a una interfaz gráfica no convencional: una constelación 3D de conceptos de aprendizaje. Cada nodo representa un concepto, módulo o necesidad de accesibilidad del sistema. Las conexiones representan relaciones de prerrequisito, dependencia o refuerzo pedagógico.

## Objetivo

Explorar una variante de interfaz inteligente para Aprende Fácil donde el estudiante pueda navegar conceptos, brechas de conocimiento, actividades de repaso y agentes LLM mediante una visualización 3D interactiva.

## Funcionalidades

- Visualización 3D de la ruta de aprendizaje con **Three.js**.
- Vista lineal para el flujo principal de estudio.
- Vista espiral para exploración alternativa.
- Nodos con etiquetas, halo, animación y estados visuales.
- Leyenda dinámica basada en los nombres reales de los nodos.
- Panel de progreso del estudiante.
- Marcado de nodos completados.
- Mini quizzes locales por nodo.
- Puntaje, insignias y progreso porcentual.
- Filtro por categoría y búsqueda de nodos.
- Chat con agentes educativos mediante Gemini API.
- Modo local simulado si no se configura API key.
- Lectura en voz alta y dictado usando Web Speech API del navegador.
- Backend local con **Node.js + Express + SQLite** para guardar progreso.

## Arquitectura del proyecto

```text
Frontend
index.html + css/styles.css + js/main.js + js/data.js + js/llm-client.js
        ↓ fetch()
Backend local
backend/server.js + backend/db.js
        ↓
SQLite
backend/aprende_facil.sqlite
```

El frontend se ejecuta con un servidor HTTP local. El backend se ejecuta aparte en el puerto `3001` y expone endpoints bajo `/api`.

## Requisitos generales

Antes de ejecutar el proyecto, se necesita:

- Git.
- Node.js 18 o superior.
- npm.
- Python 3.
- Navegador moderno: Chrome, Edge o Firefox.

Para las funciones de voz, se recomienda Chrome o Edge porque el soporte de reconocimiento de voz puede variar según navegador y sistema operativo.

## Dependencias del backend

El backend usa las siguientes dependencias de npm:

```text
express
cors
better-sqlite3
dotenv
```

Normalmente se instalan con:

```bash
cd backend
npm install
```

Si el archivo `package.json` todavía no contiene las dependencias, instalarlas con:

```bash
npm install express cors better-sqlite3 dotenv
```

Después de instalar, `package.json` debe incluir una sección parecida a:

```json
{
  "type": "module",
  "scripts": {
    "dev": "node server.js"
  },
  "dependencies": {
    "better-sqlite3": "...",
    "cors": "...",
    "dotenv": "...",
    "express": "..."
  }
}
```

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

## Ejecutar en Ubuntu / Linux

### 1. Instalar paquetes del sistema

```bash
sudo apt update
sudo apt install -y git nodejs npm python3 build-essential
```

Verificar instalación:

```bash
node -v
npm -v
python3 --version
```

### 2. Descargar o actualizar el proyecto

Si se clona por primera vez:

```bash
git clone URL_DEL_REPOSITORIO
cd IHC-Labo6-AprendeFacil
```

Si ya existe el proyecto localmente:

```bash
cd ~/Descargas/IHC-Labo6-AprendeFacil
git pull
```

### 3. Ejecutar el backend SQLite

Abrir una terminal y ejecutar:

```bash
cd ~/Descargas/IHC-Labo6-AprendeFacil/backend
npm install
npm run dev
```

Debe aparecer un mensaje similar a:

```text
Backend Aprende Fácil activo en http://localhost:3001
```

No cerrar esta terminal mientras se usa la aplicación.

### 4. Probar el backend

En otra terminal:

```bash
curl http://localhost:3001/api/progress/demo-student
```

Respuesta esperada:

```json
{
  "learningGoal": "",
  "priorKnowledge": "",
  "diagnosticNote": "",
  "diagnosticLevel": "pendiente",
  "sharedCount": 0,
  "completed": {},
  "quizScores": {},
  "quizHistory": [],
  "strengths": [],
  "weaknesses": []
}
```

### 5. Ejecutar el frontend

En otra terminal:

```bash
cd ~/Descargas/IHC-Labo6-AprendeFacil
python3 -m http.server 5500
```

Abrir en el navegador:

```text
http://localhost:5500
```

Usar `http`, no `https`.

## Ejecutar en Windows 11

### 1. Instalar programas necesarios

Instalar:

1. **Git for Windows**.
2. **Node.js LTS**. Incluye npm.
3. **Python 3** desde python.org o Microsoft Store.
4. **Visual Studio Code** opcional.
5. **Chrome o Edge** recomendado para las funciones de voz.

Durante la instalación de Python, activar la opción:

```text
Add python.exe to PATH
```

Verificar en PowerShell:

```powershell
node -v
npm -v
py --version
git --version
```

Si `py --version` no funciona, probar:

```powershell
python --version
```

### 2. Descargar o actualizar el proyecto

Primera vez:

```powershell
git clone URL_DEL_REPOSITORIO
cd IHC-Labo6-AprendeFacil
```

Si ya existe el proyecto:

```powershell
cd ruta\del\proyecto\IHC-Labo6-AprendeFacil
git pull
```

### 3. Ejecutar el backend SQLite

Abrir una terminal PowerShell:

```powershell
cd ruta\del\proyecto\IHC-Labo6-AprendeFacil\backend
npm install
npm run dev
```

Debe aparecer:

```text
Backend Aprende Fácil activo en http://localhost:3001
```

Dejar esa terminal abierta.

### 4. Probar el backend en Windows

En otra terminal PowerShell:

```powershell
Invoke-RestMethod http://localhost:3001/api/progress/demo-student
```

También se puede usar:

```powershell
curl.exe http://localhost:3001/api/progress/demo-student
```

### 5. Ejecutar el frontend en Windows

En otra terminal PowerShell:

```powershell
cd ruta\del\proyecto\IHC-Labo6-AprendeFacil
py -m http.server 5500
```

Si `py` no funciona:

```powershell
python -m http.server 5500
```

Abrir en el navegador:

```text
http://localhost:5500
```

Usar `http`, no `https`.

## Uso de la aplicación

1. Abrir el frontend en `http://localhost:5500`.
2. Verificar que el backend esté activo en `http://localhost:3001`.
3. Seleccionar un nodo de la ruta.
4. Revisar el panel de información.
5. Marcar nodos como completados o resolver mini quizzes.
6. Recargar la página para comprobar que el progreso se mantiene en SQLite.
7. Usar el chat con API key de Gemini o en modo local simulado.

## API Key de Gemini

Al abrir la aplicación aparece un modal para ingresar una API key de Gemini. Si no se configura una clave, el prototipo puede seguir funcionando con respuestas locales simuladas.

En esta versión académica, la clave se guarda en `localStorage` del navegador. Para una versión de producción, la clave debería manejarse desde el backend mediante variables de entorno y nunca exponerse en el frontend.

No subir capturas, logs, archivos `.env` ni claves reales al repositorio.

## Prueba de temperaturas del agente

En el navegador, abrir DevTools con `F12`, entrar a la consola y ejecutar:

```js
await app.runTemperatureExperiment('aprendizaje-adaptativo')
```

Esto permite comparar respuestas del agente con distintas temperaturas.

## Archivos que no deben subirse a GitHub

Revisar que `.gitignore` incluya:

```gitignore
node_modules/
backend/node_modules/
.env
backend/.env
*.sqlite
*.sqlite3
backend/aprende_facil.sqlite
```

Sí deben subirse:

```text
backend/package.json
backend/package-lock.json
backend/server.js
backend/db.js
backend/schema.sql
README.md
index.html
css/styles.css
js/main.js
js/data.js
js/llm-client.js
```

El archivo `backend/aprende_facil.sqlite` se genera automáticamente al ejecutar el backend, por lo que no es necesario subirlo.

## Problemas frecuentes

### Error: Cannot find package 'express'

Significa que faltan dependencias del backend. Solución:

```bash
cd backend
npm install express cors better-sqlite3 dotenv
npm run dev
```

### Error: Failed to connect to localhost port 3001

El backend no está corriendo. Ejecutar:

```bash
cd backend
npm run dev
```

### Error: Bad request version en el servidor Python

Suele ocurrir cuando se intenta abrir `https://localhost:5500` en vez de `http://localhost:5500`.

Usar:

```text
http://localhost:5500
```

### Error 404 favicon.ico

No afecta al funcionamiento de la aplicación. Solo indica que no existe un ícono de pestaña configurado.

### Error compilando better-sqlite3 en Ubuntu

Instalar herramientas de compilación:

```bash
sudo apt install -y build-essential python3
cd backend
npm install
```

### Error compilando better-sqlite3 en Windows 11

Normalmente `npm install` debería instalar una versión precompilada. Si falla, instalar **Visual Studio Build Tools 2022** con componentes de C++ y volver a ejecutar:

```powershell
cd backend
npm install
```

## API Key de Gemini

Al abrir la aplicación, aparecerá un modal para ingresar la API key de Gemini. Es importante seleccionar "*Guardar* la api" si se quiere probar el modelo.  La clave se guarda en `localStorage` del navegador y no se sube al repositorio.

### Comando para pruebas de temperaturas

En el navegador presionar f12 y luego en *consola* digitar este codigo para realizar
pruebas a un mismo prompt modificando la temperatura (0.0 , 0.5 , 1 y 1.5)

```text
await app.runTemperatureExperiment('interfaz-voz')
```
## Enlace del Figma del proyecto

https://www.figma.com/design/zF6fiMKpdjCsF3Wj7RTFZV/proyecto-de-ihc?node-id=98-48&t=5kSstqriQlQlm46X-1

## Estructura del proyecto

```text
IHC-Labo6-AprendeFacil/
├── backend/
│   ├── db.js
│   ├── package.json
│   ├── package-lock.json
│   ├── schema.sql
│   └── server.js
├── css/
│   └── styles.css
├── docs/
│   └── NOTAS-INFORME.md
├── index.html
├── js/
│   ├── data.js
│   ├── llm-client.js
│   └── main.js
├── LICENSE
└── README.md
```

