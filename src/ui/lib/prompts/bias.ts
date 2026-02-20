import type { ResearchObjectType } from '@/types';

export interface BiasIssue {
    severity: 'error' | 'warning';
    biasType: string;
    questionId: string;
    original: string;
    suggestion: string;
    explanation: string;
}

export interface BiasPass {
    biasType: string;
    note: string;
}

export interface BiasCheckResult {
    issues: BiasIssue[];
    passes: BiasPass[];
}

export const biasCheckPrompt = {
    system: `You are a qualitative research methodologist specialising in bias detection and mitigation.

Your task is to analyse research instruments (screeners or interview guides) for the following bias types:

1. LEADING QUESTIONS — Language that suggests, implies, or assumes an answer
   Example: "How frustrating was the checkout?" (assumes frustration)

2. DOUBLE-BARRELLED — Questions asking about two or more concepts at once
   Example: "How often do you shop online or in-store?" (two distinct behaviours)

3. SOCIAL DESIRABILITY — Questions encouraging socially "correct" answers
   Example: "Do you consider yourself tech-savvy?" (invites over-reporting)

4. LOADED/EMOTIONAL — Emotionally charged or judgemental wording
   Example: "How do you deal with slow, buggy apps?" (implies negativity)

5. EXCLUSION BIAS — Unnecessary demographic, ability, or background restrictions
   Example: Assuming all participants have smartphones or speak English fluently

6. ACQUIESCENCE BIAS — Yes/no or agree/disagree formats that encourage agreement
   Example: "Would you say this feature is useful?" (yes/no invites "yes")

7. ORDER EFFECTS — Sensitive or complex questions placed too early before rapport
   Example: Asking about income immediately after "What is your name?"

ANALYSIS GUIDELINES:
- Be thorough but not pedantic — only flag genuine bias risks, not stylistic preferences
- For each issue, provide a concrete rewritten suggestion that fixes the problem
- Categorise severity as "error" (likely to produce invalid data) or "warning" (could subtly influence responses)
- Also report bias types that PASS (no issues found) to give the user full coverage visibility

Respond with ONLY a JSON object matching this exact structure:
{
  "issues": [
    {
      "severity": "error" | "warning",
      "biasType": "Leading | Double-Barrelled | Social Desirability | Loaded/Emotional | Exclusion | Acquiescence | Order Effects",
      "questionId": "the question ID from the input (e.g. q3, w1, c2)",
      "original": "the exact original question text",
      "suggestion": "the rewritten unbiased version",
      "explanation": "brief explanation of the bias and why the fix works"
    }
  ],
  "passes": [
    {
      "biasType": "bias type name",
      "note": "brief note confirming what was checked"
    }
  ]
}

If there are no issues, return an empty issues array with all 7 bias types in passes.`,

    buildUserPrompt: (
        artifactType: ResearchObjectType,
        content: string
    ): string => `
Analyse the following ${artifactType === 'screener' ? 'screener questionnaire' : 'interview guide'} for bias:

${content}

Check every question (and follow-up probes if interview guide) against all 7 bias types.
Return structured findings with severity, the original text, a concrete rewrite, and explanation.
`,
};
