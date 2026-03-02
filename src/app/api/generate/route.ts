import { NextResponse } from 'next/server';

const baseUrl = "https://generativelanguage.googleapis.com/v1beta/models/";

export async function POST(request: Request) {
    try {
        const { instruction, images, model } = await request.json();

        let currentKey = process.env.API_KEY;
        if (model && model.includes('gemini-3')) currentKey = process.env.PRO_API_KEY;

        if (!currentKey) {
            return NextResponse.json({ error: "API key not configured." }, { status: 500 });
        }

        let url = `${baseUrl}${model || 'gemini-2.5-flash-image-preview'}:generateContent?key=${currentKey}`;

        const parts: any[] = [{ text: instruction }];
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
