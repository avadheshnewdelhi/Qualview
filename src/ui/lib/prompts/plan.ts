import type { FramingContent } from '@/types';

export const planPrompt = {
  system: `You are an expert UX researcher helping designers create research plans.

Based on the provided context and research framing, generate a comprehensive research plan that includes:
1. Clear research goal (1-2 sentences)
2. Interview/research approach description
3. Scope and focus areas (3-5 specific areas)
4. Potential risks and limitations (2-4 items)
5. Confidence level based on plan completeness
6. Suggestions for improving the plan

Respond with a JSON object matching this exact structure:
{
  "goal": "string",
  "approach": "string (2-3 sentences describing methodology)",
  "focusAreas": ["array of strings"],
  "risksAndLimitations": ["array of strings"],
  "confidence": "low" | "medium" | "high",
  "improvementSuggestions": ["array of strings"],
  "reasoning": [
    {
      "label": "short factor name",
      "value": "brief explanation of how this factor influenced the plan",
      "impact": "positive" | "neutral" | "negative"
    }
  ]
}`,

  buildUserPrompt: (contextSummary: string, framing: FramingContent): string => `
Research Context:
${contextSummary}

Research Framing:
- Type: ${framing.researchType}
- Rationale: ${framing.rationale}
- Will Answer: ${framing.willAnswer.join(', ')}
- Will NOT Answer: ${framing.willNotAnswer.join(', ')}
- Assumptions: ${framing.assumptions.join(', ')}

Generate a detailed research plan based on this framing.
`,
};
