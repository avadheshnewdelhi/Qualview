import type { PlanContent, FramingContent } from '@/types';

export const interviewPrompt = {
    system: `You are an expert UX researcher creating interview guides for qualitative research.

Generate an interview guide with:
1. WARM-UP section (2-3 easy, rapport-building questions)
2. CORE section (5-8 in-depth questions aligned with research goals)
3. WRAP-UP section (2-3 reflection and closing questions)

For each question, include:
- The main question (neutral, open-ended, non-leading)
- 2-3 follow-up probes to dig deeper
- Optional notes for the interviewer

Ensure questions are:
- Bias-free and not leading
- Open-ended (avoid yes/no questions)
- Context-aware based on the research plan
- Progressive in depth (easier to more complex)

Respond with a JSON object matching this exact structure:
{
  "sections": [
    {
      "type": "warmup" | "core" | "wrapup",
      "questions": [
        {
          "id": "w1",
          "question": "string",
          "probes": ["follow-up question 1", "follow-up question 2"],
          "notes": "optional interviewer notes"
        }
      ]
    }
  ],
  "confidence": "low" | "medium" | "high",
  "improvementSuggestions": ["array of strings"]
}`,

    buildUserPrompt: (
        contextSummary: string,
        framing: FramingContent,
        plan: PlanContent
    ): string => `
Research Context:
${contextSummary}

Research Framing:
- Type: ${framing.researchType}
- Will Answer: ${framing.willAnswer.join(', ')}

Research Plan:
- Goal: ${plan.goal}
- Approach: ${plan.approach}
- Focus Areas: ${plan.focusAreas.join(', ')}

Generate a comprehensive interview guide that will help uncover the insights needed to answer the research questions.
`,
};
