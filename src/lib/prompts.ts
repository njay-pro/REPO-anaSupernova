export const TOOLS_SCHEMA = [
    {
        function_declarations: [
            {
                name: "get_description",
                description: "Retrieve the current active style description JSON settings.",
                parameters: { type: "OBJECT", properties: {} }
            },
            {
                name: "edit_description",
                description: "Update the style description with new parameters. This performs a deep merge with the existing style.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        general: { type: "OBJECT", description: "Art direction, mood, and general style settings." },
                        outfit: { type: "OBJECT", description: "Outfit details, colors, textures, and accessories." },
                        pose: { type: "OBJECT", description: "Body language, gestures, and expressions." },
                        background: { type: "OBJECT", description: "Location, set design, and environment." },
                        photography: { type: "OBJECT", description: "Camera angles, lighting, and composition." }
                    }
                }
            },
            {
                name: "ana_style_library",
                description: "Search the Ana Style Library database for inspiration or specific style references.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        query: { type: "STRING", description: "The search query (e.g., 'high fashion', 'casual street', 'neon cyberpunk')." }
                    },
                    required: ["query"]
                }
            },
            {
                name: "generate_image",
                description: "Triggers the image generation process immediately using the current style settings.",
                parameters: { type: "OBJECT", properties: {} }
            }
        ]
    }
];

export const SYSTEM_PROMPTS = {
    chat: () => `You are a helpful, creative Art Director assistant for a cute slay influencer island girl ana.
  
  **IDENTITY & BEHAVIOR:**
  - You are autonomous and agentic.
  - **CRITICAL RULE:** Before applying a style using \`edit_description\`, you MUST check the \`ana_style_library\` for inspiration unless the user provided a VERY specific request.
  - If the user gives a vague request (e.g., "make it high fashion"), your thought process should be:
    1. Search library for "high fashion" (using \`ana_style_library\`).
    2. Analyze results.
    3. Call \`edit_description\` with the best match.
    4. Call \`generate_image\` if they explicitly asked to "do it" or "go ahead".

  **MULTI-SHOT GENERATION:**
  - If the user asks for MULTIPLE photos (e.g. "5 photos with different poses"), you MUST autonomously loop through the process: Edit Description -> Generate -> Edit Description -> Generate. 
  - Do NOT ask for confirmation between steps if the user explicitly asked for a batch. 
  - For "alternate pose" or similar requests, use your creativity to change the \`pose\` object in \`edit_description\` significantly each time.
  
  You have access to tools. Use them to retrieve information, edit styles, and trigger generation.`,

    styleExtraction: (jsonStructure: any) => `Analyze the provided image and generate a JSON object describing its stylistic elements. Fill in all fields. Output ONLY the raw JSON object. JSON Structure: ${JSON.stringify(jsonStructure)}`,

    bgExtraction: 'Extract the background of the image, remove the main subject, clean output.',

    outfitExtraction: 'Create three white mannequins wearing the exact same outfit, colors, and accessories from this image, completely remove the original subject, place them in a studio infinity white background. Layout: Two standing mannequins in a dynamic full-body pose (one showing the front view, one showing the back view) and one sitting mannequin. Arrange them in a clean, three-column layout.',

    subjectExtraction: 'Extract the main human subject from this image wearing the exact same outfit, colors, and accessories from this image, place the subject in a studio infinity white background. Layout: Two standing in a dynamic full-body pose (one showing the front view, one showing the back view) and one sitting.',

    suggestion: (field: string, json: any) => `Based on the following JSON, suggest one new, creative, and conceptually interesting alternative for the "${field}" field. Output only the new value as a short string. JSON: ${JSON.stringify(json)}`,

    editSuggestion: `Suggest 4 creative and distinct ways to edit this image. Don't get wild or fantasy. Keep it real and relatable, ready to upload for IG influencer carousel post. Provide short, guiding prompts. You are the art director of a famous Instagram model agency. Output ONLY a raw JSON array of strings.`
};

export const JSON_STRUCTURE = {
    general: { artDirection: "...", mood: "..." },
    outfit: { outfit2bodyIntention: "...", outfitDetails: "...", accessoriesDetails: "...", colorTexture: "...", footwear: "..." },
    pose: { bodyLanguage: "...", headGesture: "...", handGesture: "...", legGesture: "...", facialExpression: "...", activity: "..." },
    background: { location: "...", setDesign: "..." },
    photography: { composition: "...", compositionPrinciples: "...", framing: "...", cameraAngle: "...", lensDepthOfField: "...", lighting: "...", lightIntensity: "...", photographer: "..." }
};
