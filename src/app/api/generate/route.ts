import { NextResponse } from 'next/server';
import { getPrompt } from '@/lib/prompts';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: Request) {
    try {
        const { instruction, promptKey, params, images, model: requestedModel, aspectRatio } = await request.json();

        let finalInstruction = instruction;
        if (promptKey) {
            finalInstruction = getPrompt(promptKey, params);
        }

        let actualModel = requestedModel;
        if (!actualModel || actualModel === 'gemini-3.1-flash-image' || actualModel === 'gemini-3-flash' || actualModel.includes('2.5')) actualModel = 'gemini-3.1-flash-image-preview';

        if (actualModel === 'nano-banana-pro') actualModel = 'gemini-3-pro-image-preview';
        if (actualModel === 'nano-banana-2' || actualModel === 'nano-banana-default') actualModel = 'gemini-3.1-flash-image-preview';
        if (actualModel === 'nano-banana') actualModel = 'gemini-2.5-flash-image';

        const currentKey = process.env.API_KEY;
        if (!currentKey) {
            return NextResponse.json({ error: "API key not configured." }, { status: 500 });
        }

        const ai = new GoogleGenAI({ apiKey: currentKey });

        const parts: any[] = [{ text: finalInstruction }];
        if (images && Array.isArray(images)) {
            images.forEach((img: string) => {
                if (img) parts.push({ inlineData: { mimeType: "image/jpeg", data: img } });
            });
        }

        // Configure generation parameters via new SDK
        const config: any = {
            responseModalities: ['IMAGE', 'TEXT']
        };

        if (aspectRatio) {
            config.imageConfig = {
                aspectRatio: aspectRatio,
            };
        }

        const response = await ai.models.generateContent({
            model: actualModel,
            contents: [{ role: 'user', parts: parts }],
            config: config
        });

        // Normalize response for the frontend to prevent structure mismatches
        // Ensure candidates exist and have the expected content structure
        if (!response || !response.candidates || response.candidates.length === 0) {
            console.error("No candidates in response:", JSON.stringify(response, null, 2));
            throw new Error("Model failed to generate any candidates. Possible safety filter or internal error.");
        }

        // Return a clean, serializable JSON response
        return NextResponse.json(response);

    } catch (error: any) {
        console.error("Generate API Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
