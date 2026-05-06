// ============================================
// LLM Client - Comunicación con Gemini API
// ============================================

export class LLMClient {
    constructor(apiKey, modelName = 'gemini-2.5-flash-lite') {
        this.apiKey = apiKey;
        this.modelName = modelName;
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
        this.conversationHistory = [];
        this.temperature = 0.5;
    }

    async chat(message, systemPrompt, temperature = null) {
        if (!this.apiKey) {
            throw new Error('API key no configurada. El prototipo puede continuar en modo local.');
        }

        const url = `${this.baseUrl}/${this.modelName}:generateContent?key=${this.apiKey}`;
        const temp = temperature !== null ? temperature : this.temperature;

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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                let errorMessage = response.statusText;
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error?.message || errorMessage;
                } catch (_) {
                    // Mantener statusText si la respuesta no trae JSON.
                }
                throw new Error(`Error API (${response.status}): ${errorMessage}`);
            }

            const data = await response.json();
            const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!reply) throw new Error('Respuesta inesperada de la API');

            this.conversationHistory.push(
                { role: 'user', parts: [{ text: message }] },
                { role: 'model', parts: [{ text: reply }] }
            );

            if (this.conversationHistory.length > 20) {
                this.conversationHistory = this.conversationHistory.slice(-20);
            }

            return reply;
        } catch (error) {
            if (error.message.includes('API key not valid')) {
                throw new Error('API key inválida. Verifique su clave de Gemini.');
            }
            if (error.message.includes('429')) {
                throw new Error('Límite de peticiones excedido o cuota no disponible.');
            }
            if (error.message.toLowerCase().includes('fetch')) {
                throw new Error('Error de conexión. Verifique internet o use modo local.');
            }
            throw error;
        }
    }

    async chatOneShot(message, systemPrompt, temperature = 0.5) {
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
                temperature,
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
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!reply) throw new Error('Respuesta inesperada de la API');
        return reply;
    }

    clearHistory() {
        this.conversationHistory = [];
    }

    setTemperature(value) {
        this.temperature = Math.max(0, Math.min(2, Number(value)));
    }

    getHistory() {
        return [...this.conversationHistory];
    }
}
