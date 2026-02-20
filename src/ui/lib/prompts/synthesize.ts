import type { PlanContent, Transcript } from '@/types';

export const synthesisPrompt = {
  system: `You are an expert UX researcher synthesizing qualitative research data.

Analyze the provided interview transcripts and generate:
1. THEMATIC CLUSTERS - Group related findings into themes
2. INSIGHT CARDS - Key learnings with supporting evidence
3. OPPORTUNITY STATEMENTS - Actionable design opportunities
4. HOW MIGHT WE prompts - Reframe insights as design challenges

For each insight, assess:
- Evidence strength (weak/moderate/strong based on frequency and depth)
- Supporting quotes or evidence references

Respond with a JSON object matching this exact structure:
{
  "themes": [
    {
      "id": "theme1",
      "name": "Theme Name",
      "description": "Brief description of the theme",
      "insightIds": ["insight1", "insight2"]
    }
  ],
  "insights": [
    {
      "id": "insight1",
      "statement": "Clear insight statement",
      "evidence": [
        {
          "quote": "Exact quote from transcript",
          "participantId": "P1",
          "emotion": "frustrated",
          "sentiment": "negative",
          "journeyStage": "onboarding",
          "tags": ["usability", "error"]
        }
      ],
      "strength": "weak" | "moderate" | "strong",
      "severity": "low" | "medium" | "high" | "critical",
      "businessImpact": "low" | "medium" | "high",
      "confidenceScore": 85
    }
  ],
  "opportunities": ["Opportunity statement 1", "Opportunity statement 2"],
  "hmwPrompts": ["How might we...", "How might we..."],
  "confidence": "low" | "medium" | "high",
  "improvementSuggestions": ["array of strings"],
  "reasoning": [
    {
      "label": "short factor name (e.g. Transcript Coverage, Theme Saturation)",
      "value": "brief explanation",
      "impact": "positive" | "neutral" | "negative"
    }
  ]
}`,

  buildUserPrompt: (
    contextSummary: string,
    plan: PlanContent,
    transcripts: Transcript[]
  ): string => `
Research Context:
${contextSummary}

Research Plan:
- Goal: ${plan.goal}
- Focus Areas: ${plan.focusAreas.join(', ')}

Interview Transcripts:
${transcripts.map((t, i) => `
--- Transcript ${i + 1}: ${t.name} ---
${t.content.slice(0, 8000)}${t.content.length > 8000 ? '\n[... truncated for length ...]' : ''}
`).join('\n')}

Synthesize these transcripts into themes, insights, opportunities, and HMW prompts.
`,
};
