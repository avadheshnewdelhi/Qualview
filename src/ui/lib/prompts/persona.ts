import type { InsightsContent, Transcript } from '@/types';

export const personaPrompt = {
    system: `You are an expert UX researcher generating a behavioral persona from qualitative research data.

Analyze the provided research context, derived insights, and transcripts to generate a single representing persona.
Focus heavily on behaviors, goals, frustrations, and needs. AVOID demographic stereotypes (age, gender, income) unless strictly relevant to the product usage.

Respond with a JSON object matching this exact structure:
{
  "name": "Persona Name (e.g. The Overwhelmed Manager)",
  "role": "Job Title or Role Context",
  "description": "A brief 2-3 sentence overview of this persona and their primary context.",
  "behaviors": ["Behavior 1", "Behavior 2", "Behavior 3"],
  "goals": ["Goal 1", "Goal 2", "Goal 3"],
  "frustrations": ["Frustration 1", "Frustration 2", "Frustration 3"],
  "needs": ["Need 1", "Need 2", "Need 3"],
  "representativeQuotes": ["Quote 1", "Quote 2"],
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

Generate a single Data-Driven Behavioral Persona based on the above data.
`,
};
