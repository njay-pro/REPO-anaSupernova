import { NextResponse } from 'next/server';
import { SYSTEM_PROMPTS, TOOLS_SCHEMA } from '@/lib/prompts';

const baseUrl = "https://generativelanguage.googleapis.com/v1beta/models/";

export async function POST(request: Request) {
    try {
        const { history, model } = await request.json();

        const isPro = model && model.includes('pro');
        const currentKey = isPro ? process.env.PRO_API_KEY : process.env.API_KEY;

        if (!currentKey) {
            return NextResponse.json({ error: "API key not configured." }, { status: 500 });
        }

        let url = `${baseUrl}${model || 'gemini-2.5-flash-preview-09-2025'}:generateContent?key=${currentKey}`;

        const dynamicSystemPrompt = SYSTEM_PROMPTS.chat();

        const payload = {
            contents: history,
            systemInstruction: { parts: [{ text: dynamicSystemPrompt }] },
            tools: TOOLS_SCHEMA,
            tool_config: { function_calling_config: { mode: "AUTO" } }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json(
                { error: `Chat API Error: ${response.status} ${response.statusText}`, details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Chat API Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
