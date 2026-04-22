import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { query } = await request.json();

        if (!query) {
            return NextResponse.json({ error: "Missing query" }, { status: 400 });
        }

        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "API key not configured." }, { status: 500 });
        }

        // 1. Get Embedding
        const embedUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`;
        const embedResponse = await fetch(embedUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "models/gemini-embedding-001",
                content: { parts: [{ text: query }] },
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

        // 2. Search Pinecone
        const pineconeHost = process.env.PINECONE_HOST;
        const pineconeKey = process.env.PINECONE_API_KEY;

        if (!pineconeHost || !pineconeKey) {
            return NextResponse.json({ error: "Pinecone not fully configured." }, { status: 500 });
        }

        const url = `${pineconeHost}/query`;
        const pineconeResponse = await fetch(url, {
            method: 'POST',
            headers: {
                'Api-Key': pineconeKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                vector,
                topK: 3,
                includeMetadata: true
            })
        });

        if (!pineconeResponse.ok) {
            const errorBody = await pineconeResponse.text();
            console.error("Pinecone Error Body:", errorBody);
            throw new Error(`Pinecone Error: ${pineconeResponse.status} ${pineconeResponse.statusText} - ${errorBody}`);
        }

        const searchData = await pineconeResponse.json();

        // Parse stringified JSON from metadata back into objects
        if (searchData.matches) {
            searchData.matches = searchData.matches.map((m: any) => {
                if (m.metadata) {
                    for (const [k, v] of Object.entries(m.metadata)) {
                        if (typeof v === 'string' && (v.trim().startsWith('{') || v.trim().startsWith('['))) {
                            try { m.metadata[k] = JSON.parse(v); } catch (e) { /* ignore parse errors */ }
                        }
                    }
                }
                return m;
            });
        }

        return NextResponse.json(searchData);

    } catch (error: any) {
        console.error("Search API Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
