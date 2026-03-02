import { NextResponse } from 'next/server';
import { getPrompt } from '@/lib/prompts';

const baseUrl = "https://generativelanguage.googleapis.com/v1beta/models/";

export async function POST(request: Request) {
    try {
        const { instruction, promptKey, params, images, model } = await request.json();

        let finalInstruction = instruction;
        if (promptKey) {
            finalInstruction = getPrompt(promptKey, params);
        }

        let actualModel = model;
        if (!actualModel || actualModel === 'gemini-3.1-flash-image' || actualModel === 'gemini-3-flash' || actualModel.includes('2.5')) actualModel = 'gemini-3.1-flash-image-preview';

        if (actualModel === 'nano-banana-pro') actualModel = 'gemini-3-pro-image-preview'; // Only 3.0 pro image is available
        if (actualModel === 'nano-banana-2' || actualModel === 'nano-banana-default') actualModel = 'gemini-3.1-flash-image-preview';
        if (actualModel === 'nano-banana') actualModel = 'gemini-2.5-flash-image';

        const currentKey = process.env.API_KEY;
        if (!currentKey) {
            return NextResponse.json({ error: "API key not configured." }, { status: 500 });
        }

        let url = `${baseUrl}${actualModel}:generateContent?key=${currentKey}`;

        const parts: any[] = [{ text: finalInstruction }];
        if (images && Array.isArray(images)) {
            images.forEach((img: string) => {
                if (img) parts.push({ inlineData: { mimeType: "image/jpeg", data: img } });
            });
        }

        const payload = {
            contents: [{ parts }],
            generationConfig: { responseModalities: ['IMAGE', 'TEXT'] }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json(
                { error: `API Error: ${response.statusText}`, details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Generate API Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
