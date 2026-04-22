export const extractJson = (text: string) => {
    if (!text) return null;
    const match = text.match(/(\[.*\]|\{.*\})/s);
    return match ? JSON.parse(match[0]) : null;
};
