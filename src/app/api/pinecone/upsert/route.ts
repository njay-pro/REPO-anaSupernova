import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { id, textContent, metadata } = await request.json();

        if (!id || !textContent || !metadata) {
            return NextResponse.json({ error: "Missing required fields (id, textContent, metadata)" }, { status: 400 });
        }

        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "API key not configured." }, { status: 500 });
        }

        // 1. Get Embedding for the text content
        const embedUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`;
        const embedResponse = await fetch(embedUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "models/gemini-embedding-001",
                content: { parts: [{ text: textContent }] },
                outputDimensionality: 768
            })
        });

        if (!embedResponse.ok) {
            const err = await embedResponse.json();
            console.error("Embedding Error:", err);
            throw new Error(err.error?.message || "Failed to generate embedding");
        }
        const embedData = await embedResponse.json();
        const vector = embedData.embedding.values;

        // 2. Upsert to Pinecone
        const pineconeHost = process.env.PINECONE_HOST;
        const pineconeKey = process.env.PINECONE_API_KEY;

        if (!pineconeHost || !pineconeKey) {
            return NextResponse.json({ error: "Pinecone not fully configured." }, { status: 500 });
        }

        const pineconeMetadata: Record<string, any> = { text: textContent };
        for (const [k, v] of Object.entries(metadata)) {
            if (typeof v === 'object' && v !== null) {
                pineconeMetadata[k] = JSON.stringify(v);
            } else {
                pineconeMetadata[k] = v;
            }
        }

        const url = `${pineconeHost}/vectors/upsert`;
        const pineconeResponse = await fetch(url, {
            method: 'POST',
            headers: {
                'Api-Key': pineconeKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                vectors: [
                    {
                        id,
                        values: vector,
                        metadata: pineconeMetadata
                    }
                ]
            })
        });

        if (!pineconeResponse.ok) {
            const errorBody = await pineconeResponse.text();
            console.error("Pinecone Upsert Error:", errorBody);
            throw new Error(`Pinecone Error: ${pineconeResponse.status} ${pineconeResponse.statusText} - ${errorBody}`);
        }

        const responseData = await pineconeResponse.json();
        return NextResponse.json({ success: true, ...responseData });

    } catch (error: any) {
        console.error("Pinecone Upsert API Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
