import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store';
import { generateCompletion } from '@/lib/openai';
import { refinePrompt } from '@/lib/prompts/refine';
import { Sparkles, Loader2, Send, Pin, ChevronDown, ChevronUp } from 'lucide-react';
import type { ResearchObjectType, ResearchObjectContent } from '@/types';

interface EditPanelProps {
    /** Unique key for persistent context (e.g., 'plan', 'screener') */
    stepKey: string;
    /** The type of research object being edited */
    artifactType: ResearchObjectType;
    /** Current content of the artifact */
    currentContent: ResearchObjectContent;
    /** Callback when update produces new content */
    onUpdated: (newContent: ResearchObjectContent, confidence: string, suggestions: string[]) => void;
    /** Placeholder for the instruction input */
    placeholder?: string;
    /** Placeholder for the context input */
    contextPlaceholder?: string;
}

export function EditPanel({
    stepKey,
    artifactType,
    currentContent,
    onUpdated,
    placeholder,
    contextPlaceholder,
}: EditPanelProps) {
    const { settings, stepContexts, setStepContext } = useStore();
    const contextValue = stepContexts[stepKey] || '';

    const [instruction, setInstruction] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showContext, setShowContext] = useState(contextValue.length > 0);
    const instructionRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize instruction textarea
    useEffect(() => {
        if (instructionRef.current) {
            instructionRef.current.style.height = 'auto';
            instructionRef.current.style.height = `${Math.min(instructionRef.current.scrollHeight, 120)}px`;
        }
    }, [instruction]);

    // Focus instruction input on mount
    useEffect(() => {
        setTimeout(() => instructionRef.current?.focus(), 100);
    }, []);

    const handleUpdate = useCallback(async () => {
        if (!instruction.trim() || !settings?.apiKey) return;

        setIsUpdating(true);
        setError(null);

        try {
            // Build full instruction with pinned context
            let fullInstruction = instruction.trim();
            if (contextValue.trim()) {
                fullInstruction = `Additional context for this step: ${contextValue.trim()}\n\nInstruction: ${fullInstruction}`;
            }

            const result = await generateCompletion<
                ResearchObjectContent & { confidence?: string; improvementSuggestions?: string[] }
            >(
                settings,
                refinePrompt.system,
                refinePrompt.buildUserPrompt(
                    artifactType,
                    JSON.stringify(currentContent, null, 2),
                    fullInstruction
                )
            );

            const { confidence, improvementSuggestions, ...content } = result;

            onUpdated(
                content as ResearchObjectContent,
                confidence || 'medium',
                improvementSuggestions || []
            );

            setInstruction('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Update failed');
        } finally {
            setIsUpdating(false);
        }
    }, [instruction, contextValue, settings, artifactType, currentContent, onUpdated]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleUpdate();
            }
        },
        [handleUpdate]
    );

    return (
        <div className="p-3 space-y-3">
            {/* Pinned Context (collapsible) */}
            <div className="rounded-md border border-border/40 bg-background/60">
                <button
                    onClick={() => setShowContext(!showContext)}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    <Pin className="h-3 w-3" />
                    <span className="font-medium">Pinned Context</span>
                    {!showContext && contextValue.length > 0 && (
                        <span className="ml-1 text-[10px] text-primary/70">
                            ({contextValue.length} chars)
                        </span>
                    )}
                    <span className="ml-auto">
                        {showContext ? (
                            <ChevronUp className="h-3 w-3" />
                        ) : (
                            <ChevronDown className="h-3 w-3" />
                        )}
                    </span>
                </button>
                {showContext && (
                    <div className="px-3 pb-2">
                        <textarea
                            value={contextValue}
                            onChange={(e) => setStepContext(stepKey, e.target.value)}
                            placeholder={
                                contextPlaceholder ||
                                'Add persistent context for this step (e.g., "Enterprise B2B SaaS, 50+ seat orgs")…'
                            }
                            rows={2}
                            className="w-full text-xs bg-muted/30 border border-border/40 rounded px-2 py-1.5 resize-none outline-none placeholder:text-muted-foreground/50 focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                        />
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                            Included in all AI operations for this step.
                        </p>
                    </div>
                )}
            </div>

            {/* Instruction input + Update button */}
            <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                    <div className="flex items-center gap-1.5 mb-1">
                        <Sparkles className="h-3 w-3 text-primary/60" />
                        <span className="text-[11px] font-medium text-muted-foreground">
                            What would you like to change?
                        </span>
                    </div>
                    <textarea
                        ref={instructionRef}
                        value={instruction}
                        onChange={(e) => setInstruction(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={
                            placeholder ||
                            'e.g., "Add more probes about onboarding" or "Regenerate focusing on mobile UX"'
                        }
                        rows={1}
                        className="w-full text-sm bg-background border border-border rounded-md px-3 py-2 resize-none outline-none placeholder:text-muted-foreground/40 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                    />
                </div>
                <Button
                    size="sm"
                    onClick={handleUpdate}
                    disabled={!instruction.trim() || isUpdating}
                    className="h-9 px-3"
                >
                    {isUpdating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="h-4 w-4" />
                    )}
                </Button>
            </div>

            {/* Keyboard hint */}
            <p className="text-[10px] text-muted-foreground/60 text-right -mt-2">
                ⌘+Enter to update
            </p>

            {/* Error */}
            {error && (
                <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">{error}</p>
            )}
        </div>
    );
}
