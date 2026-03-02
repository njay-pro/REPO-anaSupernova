import { extractJson } from '@/lib/utils'; // Will add a tiny util

export const ApiService = {
    async generateCall(instruction: string, images: any[] = [], model = 'nano-banana-2', options: any = {}) {
        const execute = async (attempt = 0): Promise<any> => {
            try {
                const body = {
                    instruction,
                    images,
                    model,
                    promptKey: options.promptKey,
                    params: options.params
                };
                const response = await fetch('/api/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`API Error: ${response.status} ${response.statusText} - ${errorText}`);
                }
                return await response.json();
            } catch (e: any) {
                if (attempt < 2) {
                    await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
                    return execute(attempt + 1);
                }
                throw e;
            }
        };
        return execute();
    },

    async chatCall(history: any[], model = 'gemini-3-flash') {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ history, model })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Chat API Error: ${response.status} ${response.statusText} - ${errorText}`);
        }
        return await response.json();
    },

    async searchPinecone(query: string) {
        try {
            const response = await fetch('/api/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query })
            });

            if (!response.ok) throw new Error(`Pinecone Error: ${response.statusText}`);
            return await response.json();
        } catch (e) {
            console.error("RAG Error:", e);
            throw e;
        }
    },

    extractJson
};
