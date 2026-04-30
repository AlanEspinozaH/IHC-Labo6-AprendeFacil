// ============================================
// LLM Client - Comunicación con Gemini API para agentes de aprendizaje
// ============================================

export class LLMClient {
    constructor(apiKey, modelName = 'gemini-2.5-flash-lite') {
        this.apiKey = apiKey;
        this.modelName = modelName;
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
        this.conversationHistory = [];
        this.temperature = 0.7;
    }

    /**
     * Envía un mensaje al LLM con system instructions dinámicas.
     * @param {string} message - Mensaje del usuario
     * @param {string} systemPrompt - Instrucciones de sistema (personalidad del personaje)
     * @param {number} temperature - Nivel de creatividad (0-2)
     * @returns {Promise<string>} Respuesta del modelo
     */
    async chat(message, systemPrompt, temperature = null) {
        if (!this.apiKey) {
            throw new Error('API key no configurada. Configure su API key de Gemini primero.');
        }

        const url = `${this.baseUrl}/${this.modelName}:generateContent?key=${this.apiKey}`;
        const temp = temperature !== null ? temperature : this.temperature;

        // Construir el cuerpo de la solicitud
        const requestBody = {
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
            contents: [
                ...this.conversationHistory,
                {
                    role: 'user',
                    parts: [{ text: message }]
                }
            ],
            generationConfig: {
                temperature: temp,
                maxOutputTokens: 512,
                topP: 0.9,
                topK: 40
            }
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    `Error API (${response.status}): ${errorData.error?.message || response.statusText}`
                );
            }

            const data = await response.json();

            // Validar estructura de respuesta
            if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
                throw new Error('Respuesta inesperada de la API');
            }

            const reply = data.candidates[0].content.parts[0].text;

            // Guardar en el historial para mantener contexto
            this.conversationHistory.push(
                { role: 'user', parts: [{ text: message }] },
                { role: 'model', parts: [{ text: reply }] }
            );

            // Limitar historial a últimos 20 mensajes (10 pares) para no exceder tokens
            if (this.conversationHistory.length > 20) {
                this.conversationHistory = this.conversationHistory.slice(-20);
            }

            return reply;

        } catch (error) {
            console.error('Error en LLMClient.chat:', error);
            
            // Manejo de errores específicos
            if (error.message.includes('API key not valid')) {
                throw new Error('API key inválida. Verifique su clave de Gemini.');
            } else if (error.message.includes('429')) {
                throw new Error('Límite de peticiones excedido. Espere un momento.');
            } else if (error.message.includes('fetch')) {
                throw new Error('Error de conexión. Verifique su conexión a internet.');
            }
            
            throw error;
        }
    }

    /**
     * Envía un mensaje sin guardar en historial (para mensajes de sistema).
     */
    async chatOneShot(message, systemPrompt, temperature = 0.7) {
        if (!this.apiKey) {
            throw new Error('API key no configurada.');
        }

        const url = `${this.baseUrl}/${this.modelName}:generateContent?key=${this.apiKey}`;

        const requestBody = {
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
            contents: [{
                role: 'user',
                parts: [{ text: message }]
            }],
            generationConfig: {
                temperature: temperature,
                maxOutputTokens: 256,
                topP: 0.9
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Error API (${response.status}): ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
            throw new Error('Respuesta inesperada de la API');
        }
        return data.candidates[0].content.parts[0].text;
    }

    /**
     * Limpia el historial de conversación.
     * Útil al cambiar de personaje.
     */
    clearHistory() {
        this.conversationHistory = [];
    }

    /**
     * Configura el nivel de creatividad de las respuestas.
     * @param {number} value - 0 a 2, donde 0 es determinista y 2 es muy creativo
     */
    setTemperature(value) {
        this.temperature = Math.max(0, Math.min(2, value));
    }

    /**
     * Obtiene el historial actual de conversación.
     */
    getHistory() {
        return [...this.conversationHistory];
    }
}
