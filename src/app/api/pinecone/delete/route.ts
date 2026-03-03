import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { ids, query } = await request.json();

        if (!ids && !query) {
            return NextResponse.json({ error: "Missing ids or query" }, { status: 400 });
        }

        const pineconeHost = process.env.PINECONE_HOST;
        const pineconeKey = process.env.PINECONE_API_KEY;
        const apiKey = process.env.API_KEY;

        if (!pineconeHost || !pineconeKey || !apiKey) {
            return NextResponse.json({ error: "Pinecone or API key not fully configured." }, { status: 500 });
        }

        let targetIds: string[] = ids || [];

        // If query is provided, we first search for the closest matches to delete
        if (query && targetIds.length === 0) {
            // Get Embeddings
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
            if (!embedResponse.ok) throw new Error("Failed to generate embedding for query");
            const embedData = await embedResponse.json();
            const vector = embedData.embedding.values;

            // Search Pinecone
            const searchUrl = `${pineconeHost}/query`;
            const pineconeSearchResponse = await fetch(searchUrl, {
                method: 'POST',
                headers: { 'Api-Key': pineconeKey, 'Content-Type': 'application/json' },
                body: JSON.stringify({ vector, topK: 10, includeMetadata: false }) // find top 10 matches to the word
            });
            if (!pineconeSearchResponse.ok) throw new Error("Search failed");
            const searchData = await pineconeSearchResponse.json();

            if (searchData.matches && searchData.matches.length > 0) {
                targetIds = searchData.matches.map((m: any) => m.id);
            }
        }

        if (targetIds.length === 0) {
            return NextResponse.json({ success: true, message: "No matching styles found to delete." });
        }

        // 1. Delete from Pinecone
        const url = `${pineconeHost}/vectors/delete`;
        const pineconeResponse = await fetch(url, {
            method: 'POST',
            headers: {
                'Api-Key': pineconeKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ids: targetIds })
        });

        if (!pineconeResponse.ok) {
            const errorBody = await pineconeResponse.text();
            console.error("Pinecone Delete Error:", errorBody);
            throw new Error(`Pinecone Error: ${pineconeResponse.status} ${pineconeResponse.statusText} - ${errorBody}`);
        }

        const responseData = await pineconeResponse.json();
        return NextResponse.json({ success: true, deletedIds: targetIds, ...responseData });

    } catch (error: any) {
        console.error("Pinecone Delete API Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
