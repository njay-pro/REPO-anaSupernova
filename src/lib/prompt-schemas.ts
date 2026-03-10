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
                description: "Generates a cohesive multi-slide carousel or batch by sending a sequence of style variants based on a narrative or theme. Used for creating 'Day in the Life' sequences or photo dumps. Typically 3-6 slides, but supports any number.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        variants: {
                            type: "ARRAY",
                            description: "An array of style objects for the batch. Each object should contain the fields that vary for that specific slide (e.g. pose, photography) while keeping the core vibe consistent.",
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
    general: {
        artDirection: "Identify the overarching visual grammar, cultural anchor, and artistic philosophy of the scene.",
        mood: "Describe the atmospheric pressure and emotional vibration of the image."
    },
    outfit: {
        outfit2bodyIntention: "Analyze the sculptural dialogue between garment construction and human anatomy—how the clothing alters or emphasizes the silhouette.",
        outfitDetails: "A technical breakdown of the garment hierarchy; describe the layering logic, specific pieces, and material construction.",
        accessoriesDetails: "The secondary symbolic elements that punctuate the look and add character depth.",
        colorTexture: "The relationship between chromatic harmony and the tactile surface quality; analyze how color and material work together.",
        footwear: "The foundation of the look; analyze its structural style and its contribution to the subject's stance."
    },
    pose: {
        bodyLanguage: "The subject's kinetic relationship with gravity and the viewer; the non-verbal narrative of their stance.",
        headGesture: "The orientation of the gaze and the angle of the head as a signal of intent or emotion.",
        handGesture: "The micro-narrative of the hands; describe their expressive placement and tension.",
        legGesture: "Physical positioning as it relates to movement, balance, and spatial occupation.",
        facialExpression: "The subtle psychological layer; capture the tension between features that conveys a specific inner state.",
        activity: "The verb of the image; define the precise action or state of being the subject is performing."
    },
    background: {
        location: "The narrative setting; define the world the subject inhabits and the logic of that space.",
        setDesign: "The curation of environmental details that ground the subject in a specific contextual reality."
    },
    photography: {
        compositionPrinciple: "The abstract mathematical grid or classical rule governing the frame; identify the primary organizational strategy (e.g., Rule of Thirds, Golden Ratio, Symmetry, Centrality, The Rule of Odds, or Radial Balance).",
        compositionIntention: "The kinetic instantiation of the principle; describe how specific subject elements or environmental features (e.g., a limb creating a leading line towards a focal point, a horizon line creating a 'Rule of Two' separation between sea and cliff, or architectural elements acting as a frame-within-a-frame) execute the geometric logic.",
        framing: "Analyze the scale of the subject relative to the frame; determine the crop boundaries and how proximity balances prominence against context.",
        cameraAngle: "The power dynamic and emotional weight established by the camera's height and perspective relative to the subject.",
        lensDepthOfField: "The selective focus strategy; define the hierarchy of visual importance through clarity and blur.",
        lighting: "The physics, character, and volume of light; describe the source, direction, and quality (e.g., hard vs soft) as well as the intensity/distribution of energy (contrast ratio, highlights to shadows).",
        technicalMedium: "The mechanical signature; analyze the rendering style, grain structure, chromatic finish, and the technical medium of the image (e.g., analog film stocks like Portra 400, high-end digital sensors, or specific post-processing signatures)."
    }
};
