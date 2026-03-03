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
            },
            {
                name: "generate_carousel",
                description: "Generates a cohesive 5-slide carousel by sending a batch of style variants based on a narrative or theme. Used for creating 'Day in the Life' sequences or photo dumps. The user MUST ask for a carousel or batch.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        variants: {
                            type: "ARRAY",
                            description: "An array of 5 style objects. Each object should just contain the fields that vary for that specific slide (e.g. pose, photography) while keeping the core vibe consistent.",
                            items: {
                                type: "OBJECT",
                                properties: {
                                    general: { type: "OBJECT" },
                                    outfit: { type: "OBJECT" },
                                    pose: { type: "OBJECT" },
                                    background: { type: "OBJECT" },
                                    photography: { type: "OBJECT" }
                                }
                            }
                        }
                    },
                    required: ["variants"]
                }
            },
            {
                name: "add_style_library",
                description: "Save a style to the Ana Style Library database. Use this to permanently record a good style for future use. IMPORTANT: Ensure 'id' is a URL safe slug.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        id: { type: "STRING", description: "A unique, URL-safe slug ID for the style (e.g., 'neon-cyberpunk-v1')." },
                        text_content: { type: "STRING", description: "A descriptive text summary of the style used for vector search matching (e.g., 'A vibrant neon cyberpunk look with glowing outlines...')." },
                        metadata: { type: "OBJECT", description: "The full JSON description object of the style matching the exact JSON_STRUCTURE format." }
                    },
                    required: ["id", "text_content", "metadata"]
                }
            },
            {
                name: "delete_style_library",
                description: "Delete styles from the Ana Style Library database. If you want to delete a specific style you found, pass its 'id'. If you want to delete styles matching a concept (e.g., 'delete all neon styles'), pass a 'query' string to semantically search and bulk delete matches.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        id: { type: "STRING", description: "The ID of a specific style to delete." },
                        query: { type: "STRING", description: "A semantic search query to find and delete matching styles (e.g. 'neon')." }
                    }
                }
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
