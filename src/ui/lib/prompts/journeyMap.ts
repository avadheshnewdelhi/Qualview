import type { InsightsContent, Transcript } from '@/types';

export const journeyMapPrompt = {
    system: `You are an expert UX researcher generating a User Journey Map from qualitative research data.

Analyze the provided research context, derived insights, and transcripts to generate a linear Journey Map.
Extract the key stages of the user's experience over time. For each stage, identify the user's actions, pain points, opportunities, and their overarching emotion.

Respond with a JSON object matching this exact structure:
{
  "title": "Title of the Journey (e.g. Mobile App Onboarding Journey)",
  "targetUser": "Description of the target user group",
  "stages": [
    {
      "name": "Stage Name (e.g. Discovery, Setup, First Use)",
      "description": "Brief description of what happens in this stage",
      "emotion": "positive" | "neutral" | "negative",
      "userActions": ["Action 1", "Action 2"],
      "painPoints": ["Pain point 1", "Pain point 2"],
      "opportunities": ["Opportunity 1", "Opportunity 2"]
    }
  ],
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

Generate a chronological User Journey Map based on the above qualitative data. Aim for 3 to 6 distinct stages.
`,
};
