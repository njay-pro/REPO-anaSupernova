import { POST as upsertRoute } from '../src/app/api/pinecone/upsert/route';
import { POST as deleteRoute } from '../src/app/api/pinecone/delete/route';
import { POST as searchRoute } from '../src/app/api/search/route';

async function run() {
    console.log("--- STARTING PINECONE VERIFICATION ---");

    const TEST_ID = 'test-mock-style-999';

    // 1. Upsert
    console.log(`\n1. Upserting mock style [${TEST_ID}]...`);
    const upsertReq = new Request('http://localhost/api/pinecone/upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            id: TEST_ID,
            textContent: 'A bright neon pink and green test style with sunglasses',
            metadata: {
                general: { artDirection: "Test Art", mood: "Test Mood" },
                outfit: { outfitDetails: "Neon pink jacket" },
                pose: {}, background: {}, photography: {}
            }
        })
    });
    const upsertRes = await upsertRoute(upsertReq);
    console.log("Upsert Status:", upsertRes.status);
    console.log("Upsert Body:", await upsertRes.json());

    if (upsertRes.status !== 200) throw new Error("Upsert failed");

    // Give Pinecone a moment to index the new vector
    console.log("\nWaiting 3 seconds for Pinecone indexing...");
    await new Promise(r => setTimeout(r, 3000));

    // 2. Search
    console.log("\n2. Searching for mock style...");
    const searchReq = new Request('http://localhost/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'neon pink and green test style' })
    });
    const searchRes = await searchRoute(searchReq);
    const searchData = await searchRes.json();
    console.log("Search Matches Found:", searchData.matches?.length);
    if (searchData.matches && searchData.matches.length > 0) {
        console.log("Top Match ID:", searchData.matches[0].id);
        console.log("Top Match Score:", searchData.matches[0].score);
        console.log("Top Match Metadata:", searchData.matches[0].metadata);
    } else {
        console.error("WARNING: Mock style not found in top results. It may take longer to index.");
    }

    // 3. Delete
    console.log(`\n3. Deleting mock style [${TEST_ID}]...`);
    const deleteReq = new Request('http://localhost/api/pinecone/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: TEST_ID })
    });
    const deleteRes = await deleteRoute(deleteReq);
    console.log("Delete Status:", deleteRes.status);
    console.log("Delete Body:", await deleteRes.json());

    if (deleteRes.status !== 200) throw new Error("Delete failed");

    console.log("\n--- VERIFICATION COMPLETE ---");
}

run().catch(console.error);
