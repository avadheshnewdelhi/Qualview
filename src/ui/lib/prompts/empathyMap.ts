import type { InsightsContent, Transcript } from '@/types';

export const empathyMapPrompt = {
    system: `You are an expert UX researcher generating an Empathy Map from qualitative research data.

Analyze the provided research context, derived insights, and transcripts to generate an Empathy Map containing four quadrants: Says, Thinks, Does, and Feels.
- Says: Direct quotes or common statements.
- Thinks: Internal thoughts, beliefs, or underlying assumptions.
- Does: Observable actions and behaviors.
- Feels: Emotions experienced during the journey.

Respond with a JSON object matching this exact structure:
{
  "targetUser": "Description of the target user group (e.g. New Mobile Users)",
  "quadrants": {
    "says": ["Statement 1", "Statement 2"],
    "thinks": ["Thought 1", "Thought 2"],
    "does": ["Action 1", "Action 2"],
    "feels": ["Feeling 1", "Feeling 2"]
  },
  "confidence": "low" | "medium" | "high",
  "improvementSuggestions": ["Suggestion 1", "Suggestion 2"]
}`,

    buildUserPrompt: (
        contextSummary: string,
        insights: InsightsContent,
        transcripts: Transcript[]
    ): string => `
Research Context:
${contextSummary}

Synthesized Insights:
${JSON.stringify(insights.insights, null, 2)}

Interview Transcripts:
${transcripts.map((t, i) => `--- Transcript ${i + 1}: ${t.name} ---\n${t.content.slice(0, 4000)}`).join('\n')}

Generate an Empathy Map based on the above qualitative data.
`,
};
