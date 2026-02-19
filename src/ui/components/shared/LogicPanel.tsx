import { useState } from 'react';
import { ChevronRight, ChevronDown, Brain } from 'lucide-react';

interface ReasoningFactor {
    label: string;
    value: string;
    impact: 'positive' | 'neutral' | 'negative';
}

interface LogicPanelProps {
    /** Array of reasoning factors explaining why the AI made its decisions */
    reasoning: ReasoningFactor[];
    /** Optional summary sentence */
    summary?: string;
}

const IMPACT_STYLES = {
    positive: 'text-green-600 bg-green-50',
    neutral: 'text-gray-600 bg-gray-50',
    negative: 'text-orange-600 bg-orange-50',
};

const IMPACT_ICONS = {
    positive: '✓',
    neutral: '—',
    negative: '⚠',
};

export function LogicPanel({ reasoning, summary }: LogicPanelProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!reasoning || reasoning.length === 0) return null;

    return (
        <div className="border rounded-md overflow-hidden">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-muted-foreground hover:bg-muted/50 transition-colors"
            >
                {isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                ) : (
                    <ChevronRight className="h-3 w-3" />
                )}
                <Brain className="h-3 w-3" />
                <span>View reasoning</span>
            </button>

            {isExpanded && (
                <div className="px-3 pb-3 space-y-2 border-t">
                    {summary && (
                        <p className="text-xs text-muted-foreground pt-2 italic">
                            {summary}
                        </p>
                    )}
                    <div className="space-y-1 pt-1">
                        {reasoning.map((factor, index) => (
                            <div
                                key={index}
                                className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded ${IMPACT_STYLES[factor.impact]}`}
                            >
                                <span className="font-mono text-[10px]">
                                    {IMPACT_ICONS[factor.impact]}
                                </span>
                                <span className="font-medium min-w-[80px]">
                                    {factor.label}:
                                </span>
                                <span className="flex-1">{factor.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export type { ReasoningFactor };
