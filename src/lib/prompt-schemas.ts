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

export const JSON_STRUCTURE = {
    general: { artDirection: "...", mood: "..." },
    outfit: { outfit2bodyIntention: "...", outfitDetails: "...", accessoriesDetails: "...", colorTexture: "...", footwear: "..." },
    pose: { bodyLanguage: "...", headGesture: "...", handGesture: "...", legGesture: "...", facialExpression: "...", activity: "..." },
    background: { location: "...", setDesign: "..." },
    photography: { composition: "...", compositionPrinciples: "...", framing: "...", cameraAngle: "...", lensDepthOfField: "...", lighting: "...", lightIntensity: "...", photographer: "..." }
};
