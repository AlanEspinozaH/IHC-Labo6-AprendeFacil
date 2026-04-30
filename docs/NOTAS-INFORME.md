
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
