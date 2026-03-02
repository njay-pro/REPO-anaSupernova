import { NextResponse } from 'next/server';
import { getPrompt, TOOLS_SCHEMA } from '@/lib/prompts';

const baseUrl = "https://generativelanguage.googleapis.com/v1beta/models/";

export async function POST(request: Request) {
    try {
        const { history, model } = await request.json();

        const currentKey = process.env.API_KEY;

        if (!currentKey) {
            return NextResponse.json({ error: "API key not configured." }, { status: 500 });
        }

        let actualModel = model;
        if (!actualModel || actualModel === 'gemini-3-flash' || actualModel.includes('2.5')) actualModel = 'gemini-3-flash-preview';

        let url = `${baseUrl}${actualModel}:generateContent?key=${currentKey}`;

        const dynamicSystemPrompt = getPrompt('chat');

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
