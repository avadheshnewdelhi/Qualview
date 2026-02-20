import type { UploadedResponse } from '@/store';

export const parseResponsePrompt = {
    system: `You are a data extraction assistant. Your task is to parse participant response files and extract structured data.

Given raw text from a participant response file, extract:
1. Participant ID (from filename, header, or infer from content)
2. All question-answer pairs in a normalized format

Response files may have various formats:
- Numbered questions (1., 2., 3.)
- Q# format (Q1:, Q2:)
- Free-form with headers
- Demographics sections followed by responses
- CSV/tabular data

IMPORTANT RULES:
- Map questions to standardized IDs: q1, q2, q3, etc.
- Extract the FULL text of each answer
- If there's a demographics section, include key info (name, age, etc.) as separate fields
- Be flexible with formatting variations

Return a JSON object with this exact structure:
{
  "participantId": "string (use filename if no ID in content)",
  "answers": {
    "q1": "answer text",
    "q2": "answer text",
    ...
  },
  "demographics": {
    "name": "if available",
    "age": "if available",
    "gender": "if available",
    ...any other demographic fields
  }
}`,

    buildUserPrompt: (content: string, fileName: string): string => `
Parse this participant response file:

Filename: ${fileName}

File Content:
---
${content}
---

Extract the participant ID and all question-answer pairs. Return ONLY valid JSON.
`,
};

export interface ParsedResponseResult {
    participantId: string;
    answers: Record<string, string>;
    demographics?: Record<string, string>;
}

export async function parseResponseWithAI(
    content: string,
    fileName: string,
    settings: { model: string }
): Promise<UploadedResponse | null> {
    const { generateCompletion } = await import('@/lib/openai');

    try {
        const result = await generateCompletion<ParsedResponseResult>(
            settings as any,
            parseResponsePrompt.system,
            parseResponsePrompt.buildUserPrompt(content, fileName)
        );

        if (!result.participantId || !result.answers) {
            console.error('Invalid parse result:', result);
            return null;
        }

        // Merge demographics into answers if present (for evaluation context)
        const allAnswers = { ...result.answers };
        if (result.demographics) {
            Object.entries(result.demographics).forEach(([key, value]) => {
                if (value) {
                    allAnswers[`demo_${key}`] = value;
                }
            });
        }

        console.log('AI parsed response:', { participantId: result.participantId, answerCount: Object.keys(allAnswers).length });

        return {
            participantId: result.participantId,
            answers: allAnswers,
        };
    } catch (error) {
        console.error('AI parsing error:', error);
        return null;
    }
}
