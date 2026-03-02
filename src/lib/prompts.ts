import fs from 'fs';
import path from 'path';

const PROMPTS_DIR = path.join(process.cwd(), 'src/prompts');

export function getPrompt(key: string, variables: Record<string, any> = {}): string {
    const filePath = path.join(PROMPTS_DIR, `${key}.md`);
    if (!fs.existsSync(filePath)) {
        throw new Error(`Prompt file not found: ${key}.md`);
    }

    let content = fs.readFileSync(filePath, 'utf-8');

    // Simple variable interpolation: {{varName}}
    for (const [varName, value] of Object.entries(variables)) {
        const placeholder = `{{${varName}}}`;
        const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
        content = content.split(placeholder).join(stringValue);
    }

    return content;
}

// Re-export schemas for server-side use if needed
export * from './prompt-schemas';
