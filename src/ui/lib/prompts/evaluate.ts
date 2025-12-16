import type { ScreenerContent } from '@/types';

interface ParticipantResponse {
    participantId: string;
    answers: Record<string, string>;
}

export const evaluatePrompt = {
    system: `You are an expert UX researcher evaluating screener responses to identify qualified research participants.

For each participant, analyze their responses to:
1. Check for KNOCKOUT criteria matches
2. Verify CONSISTENCY across validation questions
3. Assess QUALITY and depth of scenario responses
4. Flag SUSPICIOUS patterns (generic, copied, or gaming responses)
5. Calculate an overall QUALIFICATION SCORE (0-100)

Respond with a JSON object matching this exact structure:
{
  "qualified": [
    {
      "id": "participant_id",
      "responses": {"question_id": "answer"},
      "score": 85,
      "flags": [],
      "reasoning": "Brief explanation of qualification"
    }
  ],
  "disqualified": [
    {
      "id": "participant_id", 
      "responses": {"question_id": "answer"},
      "score": 30,
      "flags": ["knockout_hit", "inconsistent_responses"],
      "reasoning": "Brief explanation of disqualification"
    }
  ],
  "confidence": "low" | "medium" | "high",
  "improvementSuggestions": ["array of strings"]
}

Flag types: knockout_hit, inconsistent_responses, generic_answers, suspected_gaming, low_quality`,

    buildUserPrompt: (
        screener: ScreenerContent,
        responses: ParticipantResponse[]
    ): string => `
Screener Questions:
${screener.questions.map((q) => `
${q.id}. [${q.questionType}] ${q.question}
${q.options ? `Options: ${q.options.join(', ')}` : 'Open-ended'}
${q.knockoutLogic ? `Knockout: ${q.knockoutLogic}` : ''}
`).join('\n')}

Participant Responses:
${responses.map((r) => `
Participant: ${r.participantId}
${Object.entries(r.answers).map(([qId, answer]) => `  ${qId}: ${answer}`).join('\n')}
`).join('\n---\n')}

Evaluate each participant and categorize them as qualified or disqualified.
`,
};
