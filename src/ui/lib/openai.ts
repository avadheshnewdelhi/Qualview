import type { Settings, ResearchContext } from '@/types';
import { auth } from '@/lib/firebase';

// Cloud Function URL — set after first deploy
// For local dev, use emulator URL: http://127.0.0.1:5001/qualview-plugin/us-central1/generate
const FUNCTION_URL = 'https://us-central1-qualview-plugin.cloudfunctions.net/generate';

/**
 * Get Firebase auth token for Cloud Function calls
 */
async function getAuthToken(): Promise<string> {
    const user = auth.currentUser;
    if (!user) {
        throw new Error('Please sign in to use AI features');
    }
    return user.getIdToken();
}

/**
 * Make a completion request via Cloud Function
 */
export async function generateCompletion<T>(
    settings: Settings,
    systemPrompt: string,
    userPrompt: string
): Promise<T> {
    const token = await getAuthToken();

    const response = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            model: settings.model,
            responseFormat: { type: 'json_object' },
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(error.message || `AI request failed (${response.status})`);
    }

    const data = await response.json();
    if (!data.content) {
        throw new Error('No response from AI');
    }

    return JSON.parse(data.content) as T;
}

/**
 * Make a vision completion request via Cloud Function (for OCR/image analysis)
 */
export async function generateVisionCompletion(
    imageDataUrl: string,
    prompt: string
): Promise<string> {
    const token = await getAuthToken();

    const response = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        { type: 'image_url', image_url: { url: imageDataUrl, detail: 'high' } },
                    ],
                },
            ],
            model: 'gpt-4o',
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(error.message || `Vision request failed (${response.status})`);
    }

    const data = await response.json();
    return data.content || '';
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
