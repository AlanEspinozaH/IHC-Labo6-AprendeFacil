
# Bitácora técnica — Incidencias al ejecutar el Laboratorio 6 de IHC

## 1. Contexto

Durante el desarrollo del Laboratorio 6 de Interacción Humano-Computador, se trabajó con una aplicación web estática llamada **Aprende Fácil: Constelación 3D de Aprendizaje**. La aplicación usa archivos HTML, CSS y JavaScript, renderiza una constelación 3D con Three.js y permite abrir un chat contextual con agentes conectados a la API de Gemini.

Para probar la aplicación localmente, se usó el servidor HTTP simple de Python 3.

---

## 2. Comando correcto para levantar el servidor local

El comando recomendado fue:

```bash
python3 -m http.server 8080 --bind 127.0.0.1
```

### Explicación del comando

```bash
python3
```

Se usa `python3` porque en Ubuntu el comando `python` no siempre está instalado por defecto. En el sistema usado, al ejecutar `python -m http.server 8080`, apareció el mensaje:

```text
Orden «python» no encontrada.
Quizá quiso decir:
  la orden «python3» del paquete deb «python3»
```

Por eso, el comando correcto en este entorno fue `python3`.

```bash
-m http.server
```

Ejecuta el módulo `http.server` incluido en la biblioteca estándar de Python. Este módulo permite servir archivos estáticos desde el directorio actual. Es útil para proyectos web simples con `index.html`, `css/` y `js/`, porque permite que el navegador cargue correctamente módulos JavaScript, archivos CSS y recursos locales.

```bash
8080
```

Indica el puerto local donde estará disponible la aplicación. En este caso, la aplicación queda accesible desde:

```text
http://127.0.0.1:8080
```

```bash
--bind 127.0.0.1
```

Hace que el servidor escuche únicamente en la interfaz local de la máquina. Según la documentación oficial de Python, `--bind` permite especificar una dirección concreta; si no se usa, el servidor se enlaza por defecto a todas las interfaces de red. En cambio, con `--bind 127.0.0.1`, el servidor queda limitado a localhost. ([Python documentation][1])

---

## 3. Por qué fue mejor usar `--bind 127.0.0.1`

Usar:

```bash
python3 -m http.server 8080 --bind 127.0.0.1
```

fue mejor que usar simplemente:

```bash
python3 -m http.server 8080
```

porque limita el servidor al entorno local. Esto es más seguro y más ordenado para una práctica universitaria, ya que no se necesita exponer el servidor a otros dispositivos de la red.

La aplicación solo se está probando en la misma computadora, por lo que no tiene sentido escuchar en todas las interfaces. Además, al usar API keys o pruebas con servicios externos, conviene reducir la exposición innecesaria.

---

## 4. Por qué fue mejor abrir `http://127.0.0.1:8080`

La URL correcta usada fue:

```text
http://127.0.0.1:8080
```

Esta dirección representa la máquina local usando IPv4. Es preferible frente a abrir:

```text
http://0.0.0.0:8080
```

porque `0.0.0.0` se usa normalmente como dirección de escucha del servidor, no como dirección concreta de navegación del cliente. En otras palabras:

* `127.0.0.1` significa “esta misma computadora”.
* `0.0.0.0` significa “todas las interfaces disponibles” desde el punto de vista del servidor.

Para el navegador, es más correcto y estable entrar con `127.0.0.1`.

Además, usar siempre la misma URL evita confusiones con `localStorage`. La API key de Gemini se guarda en el almacenamiento local del navegador asociado al origen actual. Por eso, si se entra una vez con `http://0.0.0.0:8080` y otra vez con `http://127.0.0.1:8080`, el navegador puede tratarlos como orígenes distintos. En consecuencia, una API key guardada en una dirección podría no aparecer en la otra.

---

## 5. Incidencia: errores `400 Bad request` en la terminal

Al levantar el servidor se observaron mensajes como:

```text
code 400, message Bad request version
code 400, message Bad request syntax
```

junto con caracteres extraños similares a:

```text
"\x16\x03\x01..."
```

Estos mensajes suelen aparecer cuando el navegador o alguna extensión intenta iniciar una conexión HTTPS/TLS contra un servidor que solo está sirviendo HTTP simple.

En este laboratorio, el servidor se levantó con:

```bash
python3 -m http.server 8080 --bind 127.0.0.1
```

Ese servidor sirve HTTP, no HTTPS. Por eso, la URL correcta debe comenzar con:

```text
http://
```

y no con:

```text
https://
```

La URL correcta es:

```text
http://127.0.0.1:8080
```

Después de esos errores iniciales, el servidor sí respondió correctamente:

```text
GET / HTTP/1.1" 200
GET /css/styles.css HTTP/1.1" 200
GET /js/main.js HTTP/1.1" 200
GET /js/llm-client.js HTTP/1.1" 200
GET /js/data.js HTTP/1.1" 200
```

Por tanto, esos errores `400` no fueron la causa principal del fallo de la aplicación. La aplicación sí cargó correctamente.

---

## 6. Incidencia: `favicon.ico` no encontrado

También apareció:

```text
GET /favicon.ico HTTP/1.1" 404
```

Este mensaje indica que el navegador intentó cargar el ícono de la pestaña, pero el proyecto no tiene un archivo `favicon.ico`.

No afecta el funcionamiento de la aplicación. Es un detalle visual menor. Se podría corregir agregando un ícono al proyecto, pero no es necesario para cumplir la funcionalidad principal del laboratorio.

---

## 7. Incidencia: el chat no se abría al presionar “Conversar con este agente”

Inicialmente, al seleccionar un nodo y presionar el botón **“Conversar con este agente”**, no se abría el panel de chat.

La primera causa detectada fue un error en el manejo del `Raycaster` de Three.js. La aplicación no siempre estaba seleccionando la esfera principal del nodo, sino a veces elementos hijos como:

* halo luminoso,
* anillo decorativo,
* etiqueta de texto.

Estos objetos hijos no tenían todos los datos semánticos del nodo, como `resumen`, `categoria` o `prompt_personaje`. Por eso aparecían errores como:

```text
Cannot read properties of undefined (reading 'substring')
Cannot read properties of undefined (reading 'toUpperCase')
```

La solución fue agregar una función que, desde el objeto intersectado, suba por sus padres hasta encontrar el nodo principal:

```js
getMainNodeFromIntersection(object) {
    let current = object;

    while (current) {
        if (this.nodes.includes(current)) {
            return current;
        }
        current = current.parent;
    }

    return null;
}
```

Luego se modificaron las funciones `onMouseMove()` y `onClick()` para usar el nodo principal real y no necesariamente el primer objeto intersectado.

Después de esta corrección, la selección de nodos funcionó correctamente y el panel lateral pudo mostrar los datos del nodo sin errores.

---

## 8. Incidencia: mensaje “Configure su API key de Gemini”

Después de corregir el problema de selección de nodos, el botón **“Conversar con este agente”** ya respondía, pero aparecía el mensaje:

```text
Configure su API key de Gemini para usar el chat con agentes.
```

Esto ocurrió porque la aplicación no tenía una API key válida cargada en memoria o guardada en `localStorage`.

La aplicación dependía de este flujo:

1. Entrar a la página.
2. Ver el modal de configuración de API key.
3. Pegar la clave de Google AI Studio.
4. Presionar **Guardar**.
5. Luego seleccionar un nodo y abrir el chat.

El error se resolvió cuando se ingresó la API key y se presionó **Guardar**, en vez de omitir la configuración. A partir de ese momento, el chat se abrió correctamente dentro de la interfaz.

---

## 9. Diferencia entre “Guardar API key” y “Omitir”

La opción **Guardar** inicializa correctamente:

```js
this.apiKey = key;
this.llm = new LLMClient(this.apiKey);
localStorage.setItem('gemini_api_key', key);
```

En cambio, si se omite la API key, la aplicación puede continuar en modo visual, pero no puede conversar con Gemini. Esto es coherente con el objetivo del laboratorio: la parte visual puede funcionar sin API key, pero el chat con LLM necesita conexión a la API.

Para la bitácora del proyecto, se concluye:

> La visualización 3D puede ejecutarse sin API key, pero la funcionalidad de chat con agentes requiere configurar una clave válida de Gemini. Si se omite la clave, la aplicación debe operar solo como visualización interactiva.

---

## 10. Incidencia: error API 429 por cuota

Una vez que el chat se abrió, apareció este error dentro del panel:

```text
Error API (429): You exceeded your current quota...
Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash
```

Este error ya no corresponde al frontend ni al servidor local. Significa que la aplicación sí intentó comunicarse con la API de Gemini, pero Google rechazó la solicitud por límites de cuota.

Según la documentación oficial de Gemini API, los límites de uso controlan cuántas solicitudes y tokens se pueden consumir en un intervalo de tiempo. Estos límites se miden normalmente por solicitudes por minuto, tokens por minuto y solicitudes por día. Si se excede alguno de esos límites, la API devuelve un error de límite o cuota. ([Google AI for Developers][2])

En este caso específico, el mensaje indica que el modelo usado fue:

```text
gemini-2.0-flash
```

y que el límite del free tier para esa métrica aparece como `0`. Esto sugiere que ese modelo no está disponible para pruebas gratuitas en el proyecto actual o que la cuenta/proyecto no tiene cuota activa para ese modelo.

---

## 11. Corrección recomendada: cambiar el modelo usado

En el archivo `llm-client.js`, se debe revisar el constructor de la clase `LLMClient`. Actualmente puede estar usando algo similar a:

```js
constructor(apiKey, modelName = 'gemini-2.0-flash') {
    this.apiKey = apiKey;
    this.modelName = modelName;
}
```

El problema es que `gemini-2.0-flash` ya aparece en la documentación de Gemini como un modelo anterior/deprecado que será retirado, y Google recomienda migrar a modelos más recientes. ([Google AI for Developers][3])

Una corrección razonable sería probar con un modelo más actual, por ejemplo:

```js
constructor(apiKey, modelName = 'gemini-2.5-flash') {
    this.apiKey = apiKey;
    this.modelName = modelName;
}
```

o, para pruebas de bajo costo, intentar:

```js
constructor(apiKey, modelName = 'gemini-2.5-flash-lite') {
    this.apiKey = apiKey;
    this.modelName = modelName;
}
```

Sin embargo, la disponibilidad real depende del proyecto de Google AI Studio, la región, la cuenta y la cuota activa. La documentación oficial indica que los límites concretos dependen del modelo y del nivel de uso del proyecto, y que pueden revisarse desde AI Studio. ([Google AI for Developers][2])

---

## 12. Recomendación técnica para pruebas

Para evitar consumir cuota innecesariamente durante el desarrollo del laboratorio, conviene:

1. No enviar una solicitud automática a Gemini apenas se abre el chat.
2. Mostrar primero el panel de chat con un mensaje local.
3. Llamar a Gemini solo cuando el usuario escriba una pregunta.
4. Reducir `maxOutputTokens`.
5. Usar un modelo disponible para pruebas.
6. Documentar el error 429 como una limitación externa de cuota, no como un error de la interfaz.

Por ejemplo, se puede cambiar el mensaje automático de bienvenida para que sea local:

```js
this.addMessage(
    'system',
    `Estás conversando con ${agentData.nombre}. Escribe una pregunta para iniciar.`
);
```

y evitar esta llamada automática:

```js
this.llm.chatOneShot(...)
```

Esto ayuda a no gastar una solicitud cada vez que se abre un nodo.

---

## 13. Conclusión de depuración

Las incidencias se resolvieron por etapas:

1. **Servidor local:** se usó correctamente `python3 -m http.server 8080 --bind 127.0.0.1`.
2. **URL correcta:** se abrió la aplicación en `http://127.0.0.1:8080`.
3. **Carga de archivos:** HTML, CSS y JavaScript cargaron correctamente con respuestas `200`.
4. **Selección de nodos:** se corrigió el problema del `Raycaster` para seleccionar el nodo principal y no objetos hijos.
5. **API key:** se verificó que era necesario guardar la clave en el modal, no omitirla.
6. **Chat funcional:** el panel de chat se abrió correctamente tras guardar la API key.
7. **Error final:** el problema restante fue de cuota/modelo en Gemini API, no de la interfaz.

Por tanto, el estado final es:

> La interfaz 3D y el chat ya funcionan a nivel de frontend. El problema pendiente es ajustar el modelo Gemini o la cuota disponible para evitar el error 429.

---

## 14. Comandos útiles para repetir la prueba

Levantar servidor:

```bash
cd ~/Descargas/IHC-Labo6-AprendeFacil
python3 -m http.server 8080 --bind 127.0.0.1
```

Abrir en navegador:

```text
http://127.0.0.1:8080
```

Limpiar API key guardada en consola del navegador:

```js
localStorage.removeItem('gemini_api_key')
location.reload()
```

Verificar si hay API key guardada:

```js
Boolean(localStorage.getItem('gemini_api_key'))
```

Ver longitud de la API key sin mostrarla:

```js
(localStorage.getItem('gemini_api_key') || '').length
```


---

## 15. Incidencia: API key anterior con cuota agotada o sin cuota disponible

Durante la prueba del chat con agentes de Aprende Fácil, inicialmente la interfaz mostraba el panel de conversación, pero las respuestas del LLM fallaban con el error:

Error API (429): You exceeded your current quota...
Quota exceeded for metric: generate_content_free_tier_requests, limit: 0, model: gemini-2.0-flash


Este error no correspondía a un fallo de Three.js, del servidor local ni del panel de chat. La aplicación sí estaba enviando solicitudes a Gemini, pero la API rechazaba la petición por límites de cuota asociados a la clave usada o al modelo configurado.

La incidencia se corrigió generando una nueva clave desde Google AI Studio mediante la opción Crear clave de API. Luego se ingresó la nueva clave en el modal de la aplicación y se seleccionó Guardar. Después de esto, el chat comenzó a responder correctamente a las preguntas realizadas desde los nodos de la constelación.

Conclusión técnica:
La funcionalidad de chat ya estaba correctamente conectada a la interfaz 3D. El problema pendiente no era de frontend, sino de autenticación/cuota del servicio externo Gemini API. Para evitar confusiones futuras, se recomienda verificar la clave activa, el modelo usado y los límites de cuota disponibles antes de concluir que la aplicación está fallando.



---

## 16. Nota

Esta incidencia puede describirse así:

> Durante las pruebas locales se identificaron tres problemas principales: configuración del servidor local, selección incorrecta de objetos hijos en Three.js y configuración de la API key de Gemini. Se corrigió el servidor usando `python3 -m http.server 8080 --bind 127.0.0.1`, se accedió mediante `http://127.0.0.1:8080`, se ajustó el raycasting para recuperar el nodo principal y se confirmó que el chat requiere guardar una API key válida. Finalmente, se detectó un error 429 asociado a cuota del modelo `gemini-2.0-flash`, por lo que se recomienda migrar a un modelo más actual y verificar los límites activos en Google AI Studio.

[1]: https://docs.python.org/3/library/http.server.html "http.server — HTTP servers — Python 3.14.4 documentation"
[2]: https://ai.google.dev/gemini-api/docs/rate-limits "Rate limits  |  Gemini API  |  Google AI for Developers"
[3]: https://ai.google.dev/gemini-api/docs/models/gemini-2.0-flash "Gemini 2.0 Flash  |  Gemini API  |  Google AI for Developers"


```markdown
---

## 17. Mejora: selector de temperatura para el agente LLM

Se agregó un selector de temperatura en el panel de chat para controlar el comportamiento del modelo. Los valores disponibles son:

| Valor | Etiqueta       |
|------:|----------------|
|   0.0 | Preciso        |
|   0.5 | Equilibrado    |
|   1.0 | Creativo       |
|   1.5 | Muy creativo   |

### Implementación clave

La temperatura se almacena en la instancia de la app y se actualiza al cambiar el selector:

```js
temperatureSelect.addEventListener('change', (e) => {
    this.currentTemperature = Number(e.target.value);
    if (this.llm) this.llm.setTemperature(this.currentTemperature);
    this.addMessage('system', `Temperatura ajustada a ${this.currentTemperature.toFixed(1)}.`);
});
```

Al enviar un mensaje, la temperatura se pasa explícitamente al modelo:

```js
const response = await this.llm.chat(text, this.currentAgent.prompt_personaje, this.currentTemperature);
```

### Teoría

La temperatura controla la variabilidad de las respuestas del modelo. Un valor bajo produce salidas más deterministas y conservadoras; un valor alto produce salidas más diversas y creativas, pero potencialmente menos controladas.

**Para agentes educativos:**

| Temperatura | Comportamiento                               | Uso recomendado                                     |
|------------:|----------------------------------------------|-----------------------------------------------------|
|         0.0 | Estable, directo, predecible                 | Definiciones, instrucciones, explicaciones precisas |
|         0.5 | Equilibrio entre precisión y naturalidad     | Tutoría académica general                           |
|         1.0 | Mayor variación, ejemplos más diversos       | Exploración de ideas, recomendaciones               |
|         1.5 | Creativo, menos predecible                   | Lluvia de ideas, propuestas alternativas            |

> **Nota importante:** La temperatura debe probarse desde la interfaz web del prototipo, no solo desde Google AI Studio. Solo así la prueba es válida para el contexto de la aplicación.

---

## 18. Mejora: función de experimentación con temperaturas

Se implementó una función auxiliar que ejecuta la misma pregunta con cuatro temperaturas distintas y registra los resultados:

```js
await app.runTemperatureExperiment('interfaz-voz')
```

La función prueba `[0.0, 0.5, 1.0, 1.5]` y guarda por cada iteración:

- temperatura usada
- respuesta generada
- cantidad de caracteres
- tiempo de respuesta
- error, si ocurre

Los resultados se imprimen con `console.table(...)` en DevTools.

### Acceso desde consola

La instancia principal se expone globalmente para facilitar pruebas durante el desarrollo:

```js
document.addEventListener('DOMContentLoaded', () => {
    window.app = new LearningConstellationsApp();
});
```

Esto permite ejecutar métodos internos desde DevTools sin agregar botones a la interfaz.

> **Advertencia:** Exponer `window.app` es útil en desarrollo y aceptable para entregas académicas locales, pero debe evitarse en producción.

> **Cuota:** Cada ejecución del experimento consume cuatro llamadas a la API (una por temperatura). Ejecutar solo las veces necesarias y documentar los resultados obtenidos.

---

## 19. Incidencia: llamada automática a Gemini al abrir el chat

En una versión intermedia, al abrir el panel de chat se disparaba una llamada automática al modelo para que el agente se presentara:

```js
this.llm.chatOneShot("Preséntate brevemente...", agentData.prompt_personaje, 0.7)
```

Esto consumía cuota innecesariamente en cada apertura de nodo, antes de que el usuario escribiera cualquier pregunta.

### Solución

Se reemplazó el mensaje generado por Gemini por un mensaje local estático:

```js
this.addMessage('character', `Hola, soy ${agentData.nombre}. Escribe una pregunta para iniciar la conversación.`);
```

### Principio aprendido

Distinguir siempre entre tres tipos de mensajes en aplicaciones con IA:

1. **Mensajes locales de interfaz** → se generan sin llamada a la API
2. **Mensajes generados por el modelo** → requieren llamada a la API
3. **Eventos que realmente necesitan razonamiento** → única justificación para consumir cuota

Si el mensaje no requiere razonamiento, debe generarse localmente. Esto reduce costos, mejora la velocidad de respuesta y evita alcanzar límites de cuota por acciones triviales.

---

## 20. Incidencia: llamadas duplicadas al enviar mensajes

Se detectó que `sendChatMessage()` podía enviar más de una solicitud al modelo por cada pregunta del usuario. El problema era una llamada a `this.llm.chat(...)` antes de la validación del texto, además de la llamada correcta dentro del bloque `try`.

**Consecuencias:**
- consumo duplicado de cuota
- respuestas repetidas en el chat
- errores 429 más frecuentes
- dificultad para depurar

### Solución: flujo correcto de `sendChatMessage()`

```js
async sendChatMessage() {
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send');
    const text = input.value.trim();

    if (!text || !this.currentAgent) return; // 1. Validar primero

    this.addMessage('user', text);           // 2. Mostrar mensaje del usuario
    input.value = '';

    input.disabled = true;                   // 3. Bloquear interfaz
    sendBtn.disabled = true;

    this.addMessage('loading', 'Escribiendo...');

    try {
        const response = await this.llm.chat( // 4. Una sola llamada al modelo
            text,
            this.currentAgent.prompt_personaje,
            this.currentTemperature
        );

        document.querySelector('#chat-messages .loading')?.remove();
        this.lastAgentResponse = response;
        this.addMessage('character', response);

    } catch (error) {
        document.querySelector('#chat-messages .loading')?.remove();
        this.addMessage('error', `Error: ${error.message}. Si aparece 429, espere antes de reenviar.`);

    } finally {
        input.disabled = false;              // 5. Restaurar interfaz siempre
        sendBtn.disabled = false;
        input.focus();
    }
}
```

### Principio aprendido

En funciones `async`, cualquier `await` antes de una validación puede ejecutar lógica costosa innecesariamente. Al trabajar con APIs externas, cada llamada cuenta para cuota, latencia y errores. **Validar primero, llamar después.**

---

## 21. Mejora: bloqueo del input durante la espera de respuesta

Mientras el modelo procesa la respuesta, se deshabilitan el campo de texto y el botón de envío:

```js
input.disabled = true;
sendBtn.disabled = true;
```

Se reactivan en el bloque `finally` para garantizar que siempre se restauren, incluso si ocurre un error:

```js
finally {
    input.disabled = false;
    sendBtn.disabled = false;
    input.focus();
}
```

El evento de teclado se actualizó de `keypress` a `keydown`, con validación del estado del input:

```js
document.getElementById('chat-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.target.disabled) {
        this.sendChatMessage();
    }
});
```

### Principio de IHC aplicado

Desactivar controles durante operaciones asíncronas comunica el estado del sistema al usuario, evita envíos accidentales por doble clic o tecla repetida, y reduce errores de cuota. La interfaz debe prevenir errores del usuario, no solo reaccionar a ellos.

---

## 22. Mejora: lectura en voz alta de respuestas del agente

Se implementó el botón **Leer** para reproducir la última respuesta del agente usando la Web Speech API del navegador.

La respuesta se guarda al recibirla:

```js
this.lastAgentResponse = response;
```

### Implementación de `speakText()`

```js
speakText(text) {
    if (!('speechSynthesis' in window)) {
        this.addMessage('error', 'Este navegador no soporta lectura en voz alta.');
        return;
    }
    if (!text?.trim()) {
        this.addMessage('system', 'No hay texto disponible para leer.');
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const spanishVoice = voices.find(v => v.lang.startsWith('es'));

    if (spanishVoice) {
        utterance.voice = spanishVoice;
        utterance.lang = spanishVoice.lang;
    }

    window.speechSynthesis.speak(utterance);
}
```

### Incidencia encontrada

Al probar el botón, inicialmente no se escuchaba audio. El problema no estaba en el código: el navegador Brave tenía restringida la reproducción del sitio. Tras ajustar los permisos, la función funcionó correctamente.

### La síntesis de voz del navegador depende de tres factores

1. Soporte del navegador para la API `speechSynthesis`
2. Voces instaladas o disponibles en el sistema operativo
3. Permisos y configuración del sitio en el navegador

Una función puede estar correctamente implementada y aun así no producir audio. En Linux, la voz suele sonar más robótica; en otros entornos puede haber voces más naturales.

### Relevancia en IHC

Esta mejora aporta accesibilidad multimodal: apoya estudio auditivo, baja visión, fatiga visual y distintas preferencias de aprendizaje.

---

## 23. Mejora: optimización del prompt del agente

Se mejoró el prompt del nodo **Interfaz de voz** para hacerlo más específico y evaluable. La versión mejorada incluye:

- contexto explícito del proyecto (Aprende Fácil)
- alcance estricto del agente
- límites técnicos del prototipo (qué no debe prometer)
- criterios de IHC aplicables
- reglas de accesibilidad
- formato recomendado de respuesta
- estilo de comunicación esperado

### Por qué importa en aplicaciones con agentes LLM

Un prompt de sistema no solo define "quién es" el agente. Debe especificar:

| Aspecto            | Pregunta que responde                          |
|--------------------|------------------------------------------------|
| Conocimiento       | ¿Qué sabe?                                     |
| Límites            | ¿Qué no debe asumir ni prometer?               |
| Comportamiento     | ¿Cómo debe responder?                          |
| Formato            | ¿Qué estructura debe seguir?                   |
| Criterios          | ¿Qué priorizar al generar respuestas?          |

En aplicaciones de IHC, el comportamiento conversacional del agente **es parte de la interfaz**. Un agente mal delimitado puede confundir al usuario, exagerar capacidades del sistema o desviarse del objetivo del prototipo.

---

## 24. Decisión técnica: respuestas del chat en texto plano

Las respuestas del modelo pueden incluir Markdown (`**negrita**`, listas, `código`). Se evaluó renderizarlo en el chat, pero se decidió mantener texto plano:

```js
msgDiv.textContent = text; // Para respuestas del modelo
```

Solo los mensajes internos del sistema usan HTML controlado:

```js
if (type === 'system') {
    msgDiv.innerHTML = text;
} else {
    msgDiv.textContent = text;
}
```

### Motivo

Insertar HTML generado por el modelo directamente en la interfaz sin sanitización es un riesgo de seguridad. Renderizar Markdown requeriría una librería externa y un proceso de sanitización. Para una entrega académica, texto plano es una decisión simple, estable y completamente defendible.

> En una versión futura, se podría integrar una librería como `marked.js` con `DOMPurify` para renderizar Markdown de forma segura.

---

## 25. Incidencia: exposición accidental de API key en consola

Durante la depuración, la URL completa de solicitud a Gemini aparecía en la consola del navegador, incluyendo el parámetro `?key=...`.

### Medidas ante una exposición accidental

1. Revocar la clave inmediatamente desde Google AI Studio
2. Generar una nueva clave
3. Limpiar capturas de pantalla, logs o documentos donde aparezca
4. No subir logs con URLs completas al repositorio

### Principio aprendido

Guardar la API key en `localStorage` es aceptable para pruebas locales, pero no es una solución segura para producción. En un sistema real, las llamadas al modelo deben pasar por un **backend o proxy** que proteja la clave y controle el uso. El cliente nunca debe tener acceso directo a credenciales de servicios externos.

---

## 26. Estado del prototipo tras las correcciones

| Componente                          | Estado                                               |
|-------------------------------------|------------------------------------------------------|
| Carga desde servidor local          | ✅ Correcta                                           |
| Constelación 3D                     | ✅ Nodos, etiquetas, halos y relaciones visibles      |
| Raycasting                          | ✅ Selecciona correctamente el nodo principal         |
| Panel de información                | ✅ Se abre al seleccionar un nodo                     |
| Apertura del chat                   | ✅ No consume cuota de Gemini al abrirse              |
| Envío de mensajes                   | ✅ Una sola llamada al modelo por mensaje             |
| Selector de temperatura             | ✅ Modifica la configuración usada en la llamada      |
| Función de experimentación          | ✅ Compara respuestas con temperaturas 0.0–1.5        |
| Lectura en voz alta                 | ✅ Reproduce la última respuesta del agente           |
| Prompt de "Interfaz de voz"         | ✅ Mejorado con contexto, límites y criterios claros  |

### Conclusión

La mayor parte de las incidencias no fueron errores aislados, sino problemas típicos de integración entre frontend, WebGL, servicios externos y navegador. La depuración permitió distinguir claramente entre:

- errores de selección de objetos 3D
- errores de estado de interfaz (doble envío, bloqueo de input)
- errores de configuración de API key
- errores externos por cuota (429)
- restricciones propias del navegador

Esta separación fue clave para corregir el proyecto sin confundir problemas de frontend con limitaciones del servicio Gemini o del navegador.
```