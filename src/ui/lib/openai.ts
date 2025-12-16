import OpenAI from 'openai';
import type { Settings, ResearchContext } from '@/types';

let openaiClient: OpenAI | null = null;

/**
 * Initialize or get the OpenAI client
 */
export function getOpenAIClient(settings: Settings): OpenAI {
    if (!openaiClient || openaiClient.apiKey !== settings.apiKey) {
        openaiClient = new OpenAI({
            apiKey: settings.apiKey,
            dangerouslyAllowBrowser: true, // Required for client-side usage
        });
    }
    return openaiClient;
}

/**
 * Make a completion request with JSON response
 */
export async function generateCompletion<T>(
    settings: Settings,
    systemPrompt: string,
    userPrompt: string
): Promise<T> {
    const client = getOpenAIClient(settings);

    const response = await client.chat.completions.create({
        model: settings.model,
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 16384, // Increased for larger responses (many participants)
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
        throw new Error('No response from OpenAI');
    }

    return JSON.parse(content) as T;
}

/**
 * Build context summary for prompts
 */
export function buildContextSummary(context: ResearchContext): string {
    if (context.sources.length === 0) {
        return 'No context provided.';
    }

    const parts = context.sources.map((source) => {
        const header = source.type === 'canvas'
            ? 'From Canvas Selection:'
            : source.type === 'file'
                ? `From File (${source.metadata.fileName}):`
                : 'Manual Input:';

        return `${header}\n${source.content}`;
    });

    return parts.join('\n\n---\n\n');
}
