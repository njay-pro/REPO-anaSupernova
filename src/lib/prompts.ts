import fs from 'fs';
import path from 'path';

const PROMPTS_DIR = path.join(process.cwd(), 'src/prompts');

// Add new prompt keys here as you add new .md files
export type PromptKey =
    | 'chat'
    | 'generate-image'
    | 'style-extraction'
    | 'bg-extraction'
    | 'outfit-extraction'
    | 'subject-extraction'
    | 'edit-suggestion'
    | 'suggestion';

export function getPrompt(key: PromptKey, variables: Record<string, any> = {}): string {
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
