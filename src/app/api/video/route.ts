import { NextResponse } from 'next/server';

const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

export async function POST(request: Request) {
    try {
        const { image, prompt, aspectRatio = "1:1" } = await request.json();

        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "API key not configured." }, { status: 500 });
        }

        // 1. Map internal 1:1, 16:9, 9:16 to Veo supported values
        let veoAspectRatio = "16:9";
        if (aspectRatio === "9:16") veoAspectRatio = "9:16";

        // 2. Initiate Video Generation
        // Note: For Veo 3.1 via REST, we use bytesBase64Encoded for direct image data
        const body = {
            instances: [{
                prompt: prompt || "A cinematic animation based on the provided image.",
                image: {
                    bytesBase64Encoded: image,
                    mimeType: "image/png"
                }
            }],
            parameters: {
                aspectRatio: veoAspectRatio
            }
        };

        const response = await fetch(`${BASE_URL}/models/veo-3.1-generate-preview:predictLongRunning?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Veo API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error("Video API Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const name = searchParams.get('name');

        if (!name) {
            return NextResponse.json({ error: "Operation name required" }, { status: 400 });
        }

        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: "API key not configured." }, { status: 500 });
        }

        const response = await fetch(`${BASE_URL}/${name}`, {
            method: 'GET',
            headers: {
                'x-goog-api-key': apiKey
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Veo Status Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error: any) {
        console.error("Video Status Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
