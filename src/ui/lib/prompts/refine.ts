import type { ResearchObjectType } from '@/types';

/**
 * Generic prompt for refining any research artifact based on user instructions.
 * Works across all step types: framing, plan, screener, interview-guide, insights.
 */
export const refinePrompt = {
    system: `You are an expert UX researcher. The user has already generated a research artifact and wants to modify it.

Your job is to:
1. Take the EXISTING artifact (JSON) and the user's REFINEMENT INSTRUCTION
2. Apply the requested changes while preserving the overall structure
3. Return the COMPLETE modified artifact in the same JSON format

RULES:
- Maintain the exact same JSON schema as the input
- Only modify what the user asks for — preserve everything else
- If the instruction is ambiguous, make a reasonable interpretation
- Keep the same confidence level unless the change significantly affects it
- Update improvementSuggestions if the change addresses any of them
- Always return valid JSON`,

    buildUserPrompt: (
        artifactType: ResearchObjectType,
        currentContent: string,
        instruction: string
    ): string => `
Artifact Type: ${artifactType}

Current Artifact (JSON):
${currentContent}

User's Refinement Instruction:
"${instruction}"

Apply the requested changes and return the COMPLETE modified artifact as valid JSON. Maintain the exact same schema.
`,
};
