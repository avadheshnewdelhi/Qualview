import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store';
import { generateCompletion } from '@/lib/openai';
import { refinePrompt } from '@/lib/prompts/refine';
import { Lightbulb, Sparkles, Loader2, Check } from 'lucide-react';
import type { ResearchObjectType, ResearchObjectContent } from '@/types';

interface SuggestionPanelProps {
    suggestions: string[];
    artifactType: ResearchObjectType;
    currentContent: ResearchObjectContent;
    onApplied: (newContent: ResearchObjectContent, confidence: string, suggestions: string[]) => void;
    label?: string;
}

export function SuggestionPanel({
    suggestions,
    artifactType,
    currentContent,
    onApplied,
    label,
}: SuggestionPanelProps) {
    const { settings } = useStore();
    const [appliedIndices, setAppliedIndices] = useState<Set<number>>(new Set());
    const [applyingIndex, setApplyingIndex] = useState<number | null>(null);
    const [isApplyingAll, setIsApplyingAll] = useState(false);

    const applySuggestion = useCallback(
        async (instruction: string, index?: number) => {
            if (!settings?.apiKey) return;

            if (index !== undefined) {
                setApplyingIndex(index);
            } else {
                setIsApplyingAll(true);
            }

            try {
                const result = await generateCompletion<
                    ResearchObjectContent & { confidence?: string; improvementSuggestions?: string[] }
                >(
                    settings,
                    refinePrompt.system,
                    refinePrompt.buildUserPrompt(
                        artifactType,
                        JSON.stringify(currentContent, null, 2),
                        instruction
                    )
                );

                const { confidence, improvementSuggestions, ...content } = result;
                onApplied(
                    content as ResearchObjectContent,
                    confidence || 'medium',
                    improvementSuggestions || []
                );

                if (index !== undefined) {
                    setAppliedIndices((prev) => new Set([...prev, index]));
                } else {
                    // All applied — mark all
                    setAppliedIndices(new Set(suggestions.map((_, i) => i)));
                }
            } catch (err) {
                console.error('Apply suggestion error:', err);
            } finally {
                setApplyingIndex(null);
                setIsApplyingAll(false);
            }
        },
        [settings, artifactType, currentContent, onApplied, suggestions]
    );

    const handleApplyAll = useCallback(() => {
        const unapplied = suggestions.filter((_, i) => !appliedIndices.has(i));
        if (unapplied.length === 0) return;
        const instruction = `Apply these improvements:\n${unapplied.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
        applySuggestion(instruction);
    }, [suggestions, appliedIndices, applySuggestion]);

    const handleApplyOne = useCallback(
        (suggestion: string, index: number) => {
            applySuggestion(suggestion, index);
        },
        [applySuggestion]
    );

    if (suggestions.length === 0) return null;

    const unappliedCount = suggestions.filter((_, i) => !appliedIndices.has(i)).length;

    return (
        <Card className="bg-amber-50 border-amber-200">
            <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2 text-amber-800">
                        <Lightbulb className="h-4 w-4" />
                        {label || `To improve this ${artifactType}`}
                    </CardTitle>
                    {unappliedCount > 0 && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs bg-white/80 border-amber-300 text-amber-800 hover:bg-amber-100"
                            onClick={handleApplyAll}
                            disabled={isApplyingAll || applyingIndex !== null}
                        >
                            {isApplyingAll ? (
                                <>
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    Applying…
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    Apply All
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <ul className="space-y-1">
                    {suggestions.map((s, i) => (
                        <li
                            key={i}
                            className={`group flex items-start gap-2 text-sm rounded px-2 py-1 -mx-2 transition-colors ${appliedIndices.has(i)
                                    ? 'text-green-700 line-through opacity-60'
                                    : 'text-amber-700 hover:bg-amber-100/50'
                                }`}
                        >
                            {appliedIndices.has(i) ? (
                                <Check className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-green-600" />
                            ) : (
                                <span className="mt-0.5 flex-shrink-0">•</span>
                            )}
                            <span className="flex-1">{s}</span>
                            {!appliedIndices.has(i) && (
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 px-2 text-[11px] opacity-0 group-hover:opacity-100 transition-opacity text-amber-700 hover:text-amber-900 hover:bg-amber-200/50"
                                    onClick={() => handleApplyOne(s, i)}
                                    disabled={applyingIndex === i || isApplyingAll}
                                >
                                    {applyingIndex === i ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                        'Apply'
                                    )}
                                </Button>
                            )}
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}
