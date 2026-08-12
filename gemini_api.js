/* ==========================================================================
   GOOGLE GEMINI AI INTEGRATION MODULE (GEMINI 2.5 FLASH & VISION)
   Handles Real-Time Voice Reasoning & Multimodal Image Snapshot Analysis
   ========================================================================== */

class GeminiAIEngine {
    constructor() {
        this.model = 'gemini-2.5-flash';
        this.apiKey = localStorage.getItem('jarvis_gemini_api_key') || '';
        this.endpoint = 'https://generativelanguage.googleapis.com/v1beta/models';
    }

    setApiKey(key) {
        this.apiKey = key.trim();
        if (this.apiKey) {
            localStorage.setItem('jarvis_gemini_api_key', this.apiKey);
        } else {
            localStorage.removeItem('jarvis_gemini_api_key');
        }
    }

    hasApiKey() {
        return Boolean(this.apiKey);
    }

    /* ----------------------------------------------------------------------
       GEMINI TEXT GENERATION (VOICE & REASONING)
       ---------------------------------------------------------------------- */
    async generateResponse(userPrompt) {
        if (!this.apiKey) {
            // Try calling server proxy first if no client key set
            const proxyRes = await this.callServerProxy({ prompt: userPrompt });
            if (proxyRes) return proxyRes;

            return this.getOfflineFallbackResponse(userPrompt);
        }

        const url = `${this.endpoint}/${this.model}:generateContent?key=${this.apiKey}`;
        const payload = {
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: `You are J.A.R.V.I.S., a highly intelligent, polite, futuristic AI assistant with Doctor Strange Mystic Arts integration. Keep responses concise, direct, and under 3 sentences for clear spoken audio. Question: ${userPrompt}` }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 150
            }
        };

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errData = await res.json();
                console.error('[GEMINI API ERROR]', errData);
                throw new Error(errData.error?.message || 'Gemini API request failed');
            }

            const data = await res.json();
            const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
            return textResponse ? textResponse.trim() : "I am standing by, sir.";

        } catch (err) {
            console.error('[GEMINI ERROR]', err);
            return `Gemini system report: ${err.message}. Standing by for further commands.`;
        }
    }

    /* ----------------------------------------------------------------------
       GEMINI MULTIMODAL VISION SNAPSHOT ANALYSIS
       ---------------------------------------------------------------------- */
    async analyzeVisionSnapshot(base64ImageJpeg, prompt = "Analyze this image in 2 concise sentences as JARVIS AI.") {
        if (!this.apiKey) {
            return "Sir, please configure your Google Gemini API Key in HUD settings to enable live vision analysis.";
        }

        // Clean base64 header if present
        const base64Data = base64ImageJpeg.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

        const url = `${this.endpoint}/${this.model}:generateContent?key=${this.apiKey}`;
        const payload = {
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            inlineData: {
                                mimeType: "image/jpeg",
                                data: base64Data
                            }
                        },
                        {
                            text: `You are J.A.R.V.I.S. analyzing the user's camera feed. Explain what you see (objects, math equations, hands, room) clearly in 2 concise sentences. Prompt: ${prompt}`
                        }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 120
            }
        };

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const errData = await res.json();
                console.error('[GEMINI VISION ERROR]', errData);
                throw new Error(errData.error?.message || 'Gemini Vision API failed');
            }

            const data = await res.json();
            const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
            return textResponse ? textResponse.trim() : "Analysis complete. Object identified in field of view.";

        } catch (err) {
            console.error('[GEMINI VISION ERROR]', err);
            return `Vision scan error: ${err.message}.`;
        }
    }

    async callServerProxy(payload) {
        try {
            const res = await fetch('/api/gemini', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const data = await res.json();
                return data.response;
            }
        } catch (e) {
            // Server proxy not available
        }
        return null;
    }

    getOfflineFallbackResponse(prompt) {
        const lower = prompt.toLowerCase();
        if (lower.includes('math') || lower.includes('equation') || lower.includes('differential')) {
            return "Differential equations describe the relationship between functions and their derivatives. I can solve linear and partial differential equations for you, sir.";
        }
        if (lower.includes('doctor strange') || lower.includes('magic') || lower.includes('mystic')) {
            return "The Mystic Arts access energy drawn from other dimensions of the Multiverse to conjure Tao Mandalas and Eldritch shields.";
        }
        return `I have processed your query regarding "${prompt}". Configure your Google Gemini API key in HUD settings to unlock deep neural reasoning.`;
    }
}
