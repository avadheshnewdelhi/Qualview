import { useState } from 'react';
import { useStore } from '@/store';
import { Plus, ChevronUp } from 'lucide-react';

interface StepContextInputProps {
    /** Unique key for this step's context (e.g., 'plan', 'screener') */
    stepKey: string;
    /** Placeholder hint for the textarea */
    placeholder?: string;
}

export function StepContextInput({ stepKey, placeholder }: StepContextInputProps) {
    const { stepContexts, setStepContext } = useStore();
    const value = stepContexts[stepKey] || '';
    const [isOpen, setIsOpen] = useState(value.length > 0);

    return (
        <div className="rounded-lg border border-dashed border-border/60">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
                {isOpen ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                    <Plus className="h-3.5 w-3.5" />
                )}
                <span>
                    {isOpen ? 'Additional context' : 'Add context for this step'}
                </span>
                {!isOpen && value.length > 0 && (
                    <span className="ml-auto text-[10px] text-primary/70 font-medium">
                        {value.length} chars
                    </span>
                )}
            </button>
            {isOpen && (
                <div className="px-3 pb-3">
                    <textarea
                        value={value}
                        onChange={(e) => setStepContext(stepKey, e.target.value)}
                        placeholder={placeholder || 'Add any additional context, constraints, or notes for this step…'}
                        rows={3}
                        className="w-full text-sm bg-muted/30 border border-border/40 rounded-md px-3 py-2 resize-none outline-none placeholder:text-muted-foreground/50 focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">
                        This context will be included when generating or refining this step.
                    </p>
                </div>
            )}
        </div>
    );
}
