import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store';
import { generateCompletion } from '@/lib/openai';
import { refinePrompt } from '@/lib/prompts/refine';
import { Sparkles, Loader2, Send } from 'lucide-react';
import type { ResearchObjectType, ResearchObjectContent } from '@/types';

interface PromptRefinerProps {
    /** The type of research object being refined */
    artifactType: ResearchObjectType;
    /** The current content of the artifact */
    currentContent: ResearchObjectContent;
    /** Callback when refinement produces new content */
    onRefined: (newContent: ResearchObjectContent, confidence: string, suggestions: string[]) => void;
}

export function PromptRefiner({ artifactType, currentContent, onRefined }: PromptRefinerProps) {
    const { settings } = useStore();
    const [instruction, setInstruction] = useState('');
    const [isRefining, setIsRefining] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
            inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
        }
    }, [instruction]);

    const handleRefine = useCallback(async () => {
        if (!instruction.trim() || !settings?.apiKey) return;

        setIsRefining(true);
        setError(null);

        try {
            const result = await generateCompletion<
                ResearchObjectContent & { confidence?: string; improvementSuggestions?: string[] }
            >(
                settings,
                refinePrompt.system,
                refinePrompt.buildUserPrompt(
                    artifactType,
                    JSON.stringify(currentContent, null, 2),
                    instruction.trim()
                )
            );

            const { confidence, improvementSuggestions, ...content } = result;

            onRefined(
                content as ResearchObjectContent,
                confidence || 'medium',
                improvementSuggestions || []
            );

            setInstruction('');
            setError(null);
        } catch (err) {
            console.error('Refine error:', err);
            setError('Failed to refine. Please try again.');
        } finally {
            setIsRefining(false);
        }
    }, [instruction, settings, artifactType, currentContent, onRefined]);

    const placeholder = getPlaceholder(artifactType);

    return (
        <div className="space-y-1">
            <div
                className={`flex items-end gap-2 rounded-lg border px-3 py-2 transition-all ${isFocused
                        ? 'border-primary/50 bg-background shadow-sm ring-1 ring-primary/20'
                        : 'border-border bg-muted/30 hover:bg-muted/50'
                    }`}
            >
                <Sparkles className="h-4 w-4 text-muted-foreground flex-shrink-0 mb-1.5" />
                <textarea
                    ref={inputRef}
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={placeholder}
                    disabled={isRefining}
                    rows={1}
                    className="flex-1 bg-transparent text-sm resize-none outline-none placeholder:text-muted-foreground/60 min-h-[24px] leading-6 py-0"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            e.preventDefault();
                            handleRefine();
                        }
                    }}
                />
                <Button
                    size="icon"
                    variant={instruction.trim() ? 'default' : 'ghost'}
                    className="h-7 w-7 flex-shrink-0"
                    onClick={handleRefine}
                    disabled={!instruction.trim() || isRefining || !settings?.apiKey}
                >
                    {isRefining ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                        <Send className="h-3.5 w-3.5" />
                    )}
                </Button>
            </div>
            {error && (
                <p className="text-xs text-destructive px-3">{error}</p>
            )}
            {isFocused && (
                <p className="text-[11px] text-muted-foreground px-3">⌘+Enter to send</p>
            )}
        </div>
    );
}

function getPlaceholder(type: ResearchObjectType): string {
    switch (type) {
        case 'framing':
            return 'Refine: e.g., "Change to an evaluative study"';
        case 'plan':
            return 'Refine: e.g., "Add accessibility as a focus area"';
        case 'screener':
            return 'Refine: e.g., "Add a knockout for users under 18"';
        case 'interview-guide':
            return 'Refine: e.g., "Add more probes about onboarding"';
        case 'insights':
            return 'Refine: e.g., "Merge the first two themes"';
        default:
            return 'Refine: describe the changes you want…';
    }
}
