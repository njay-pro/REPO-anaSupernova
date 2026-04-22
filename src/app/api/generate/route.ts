import { NextResponse } from 'next/server';
import { getPrompt } from '@/lib/prompts';
import { GoogleGenAI } from '@google/genai';

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number, lastReset: number }>();
const LIMIT = 10; // requests
const WINDOW = 60 * 1000; // 1 minute

export async function POST(request: Request) {
    // Basic rate limiting by IP (approximated from headers)
    const ip = request.headers.get('x-forwarded-for') || 'anon';
    const now = Date.now();
    const userLimit = rateLimitMap.get(ip) || { count: 0, lastReset: now };

    if (now - userLimit.lastReset > WINDOW) {
        userLimit.count = 0;
        userLimit.lastReset = now;
    }

    if (userLimit.count >= LIMIT) {
        return NextResponse.json({ error: "Rate limit exceeded. Please wait a minute." }, { status: 429 });
    }
    userLimit.count++;
    rateLimitMap.set(ip, userLimit);

    try {
        const { instruction, promptKey, params, images, model: requestedModel, aspectRatio, modalities } = await request.json();

        let finalInstruction = instruction;
        if (promptKey) {
            finalInstruction = getPrompt(promptKey as any, params);
        }

        let actualModel = requestedModel;
        // Logic for model mapping stays the same
        if (!actualModel || actualModel === 'gemini-3.1-flash-image' || actualModel === 'gemini-3-flash' || actualModel.includes('2.5')) actualModel = 'gemini-3.1-flash-image-preview';
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

        // --- MODALITY & MODEL OPTIMITATION ---
        // If the user explicitly passes modalities, use them.
        // Otherwise, infer: Suggestions and style extractions ONLY need TEXT.
        // Actual image generation/editing needs IMAGE + TEXT (for thoughts/signatures).
        let finalModalities = modalities;
        if (!finalModalities) {
            if (promptKey === 'suggestion' || promptKey === 'edit-suggestion' || promptKey === 'style-extraction') {
                finalModalities = ['TEXT'];
            } else {
                finalModalities = ['IMAGE', 'TEXT'];
            }
        }

        // --- MODEL OPTIMIZATION ---
        // If we only need text, use the requested high-reliability preview model.
        if (finalModalities.length === 1 && finalModalities[0] === 'TEXT') {
            actualModel = 'gemini-3-flash-preview';
        }

        const config: any = {
            responseModalities: finalModalities
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

        if (!response || !response.candidates || response.candidates.length === 0) {
            console.error("No candidates in response:", JSON.stringify(response, null, 2));
            throw new Error("Model failed to generate any candidates. Possible safety filter or internal error.");
        }

        return NextResponse.json(response);

    } catch (error: any) {
        console.error("Generate API Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
