import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store';
import { generateCompletion } from '@/lib/openai';
import { refinePrompt } from '@/lib/prompts/refine';
import { Lightbulb, Sparkles, Loader2, Check, Square, CheckSquare } from 'lucide-react';
import type { ResearchObjectType, ResearchObjectContent } from '@/types';

interface SuggestionPanelProps {
    suggestions: string[];
    artifactType: ResearchObjectType;
    /** Required for 'apply' mode, optional for 'checklist' */
    currentContent?: ResearchObjectContent;
    /** Required for 'apply' mode, optional for 'checklist' */
    onApplied?: (newContent: ResearchObjectContent, confidence: string, suggestions: string[]) => void;
    label?: string;
    /** 'apply' = Apply All + per-item Apply (Screener/Interview). 'checklist' = checkboxes only (Framing/Plan/Synthesis). Default: 'checklist' */
    mode?: 'apply' | 'checklist';
}

export function SuggestionPanel({
    suggestions,
    artifactType,
    currentContent,
    onApplied,
    label,
    mode = 'checklist',
}: SuggestionPanelProps) {
    const { settings, isSignedIn } = useStore();
    const [checkedIndices, setCheckedIndices] = useState<Set<number>>(new Set());
    const [applyingIndex, setApplyingIndex] = useState<number | null>(null);
    const [isApplyingAll, setIsApplyingAll] = useState(false);

    // --- Apply mode logic ---
    const applySuggestion = useCallback(
        async (instruction: string, index?: number) => {
            if (mode !== 'apply' || !isSignedIn || !currentContent || !onApplied) return;

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
                    setCheckedIndices((prev) => new Set([...prev, index]));
                } else {
                    setCheckedIndices(new Set(suggestions.map((_, i) => i)));
                }
            } catch (err) {
                console.error('Apply suggestion error:', err);
            } finally {
                setApplyingIndex(null);
                setIsApplyingAll(false);
            }
        },
        [mode, settings, artifactType, currentContent, onApplied, suggestions]
    );

    const handleApplyAll = useCallback(() => {
        const unapplied = suggestions.filter((_, i) => !checkedIndices.has(i));
        if (unapplied.length === 0) return;
        const instruction = `Apply these improvements:\n${unapplied.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
        applySuggestion(instruction);
    }, [suggestions, checkedIndices, applySuggestion]);

    const handleApplyOne = useCallback(
        (suggestion: string, index: number) => {
            applySuggestion(suggestion, index);
        },
        [applySuggestion]
    );

    // --- Checklist mode logic ---
    const toggleCheck = useCallback((index: number) => {
        setCheckedIndices((prev) => {
            const next = new Set(prev);
            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }
            return next;
        });
    }, []);

    if (suggestions.length === 0) return null;

    const uncheckedCount = suggestions.filter((_, i) => !checkedIndices.has(i)).length;

    return (
        <Card className="bg-amber-50 border-amber-200">
            <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm flex items-center gap-2 text-amber-800">
                        <Lightbulb className="h-4 w-4" />
                        {label || `To improve this ${artifactType}`}
                    </CardTitle>
                    {mode === 'apply' && uncheckedCount > 0 && (
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
                    {suggestions.map((s, i) => {
                        const isChecked = checkedIndices.has(i);

                        if (mode === 'checklist') {
                            return (
                                <li
                                    key={i}
                                    className={`flex items-start gap-2 text-sm rounded px-2 py-1 -mx-2 cursor-pointer transition-colors ${isChecked
                                            ? 'text-green-700 hover:bg-green-50/50'
                                            : 'text-amber-700 hover:bg-amber-100/50'
                                        }`}
                                    onClick={() => toggleCheck(i)}
                                >
                                    {isChecked ? (
                                        <CheckSquare className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
                                    ) : (
                                        <Square className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-400" />
                                    )}
                                    <span className={isChecked ? 'line-through opacity-60' : ''}>
                                        {s}
                                    </span>
                                </li>
                            );
                        }

                        // Apply mode
                        return (
                            <li
                                key={i}
                                className={`group flex items-start gap-2 text-sm rounded px-2 py-1 -mx-2 transition-colors ${isChecked
                                        ? 'text-green-700 line-through opacity-60'
                                        : 'text-amber-700 hover:bg-amber-100/50'
                                    }`}
                            >
                                {isChecked ? (
                                    <Check className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-green-600" />
                                ) : (
                                    <span className="mt-0.5 flex-shrink-0">•</span>
                                )}
                                <span className="flex-1">{s}</span>
                                {!isChecked && (
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
                        );
                    })}
                </ul>
            </CardContent>
        </Card>
    );
}
