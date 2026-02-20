import { Card, CardContent } from '@/components/ui/card';
import type { InsightsContent, Insight } from '@/types';

interface StrengthLadderProps {
    insights: InsightsContent;
    onInsert?: (vizType: string, data: unknown) => void;
}

const STRENGTH_ORDER: Insight['strength'][] = ['strong', 'moderate', 'weak'];

const STRENGTH_STYLES: Record<string, { label: string; barColor: string; textColor: string; bgColor: string }> = {
    strong: { label: 'Strong Evidence', barColor: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-50' },
    moderate: { label: 'Moderate Evidence', barColor: 'bg-blue-400', textColor: 'text-blue-700', bgColor: 'bg-blue-50' },
    weak: { label: 'Needs More Evidence', barColor: 'bg-orange-400', textColor: 'text-orange-700', bgColor: 'bg-orange-50' },
};

export function StrengthLadder({ insights, onInsert }: StrengthLadderProps) {
    const maxEvidence = Math.max(...insights.insights.map((i) => i.evidence.length), 1);

    const grouped = STRENGTH_ORDER.map((s) => ({
        strength: s,
        items: insights.insights.filter((i) => i.strength === s),
    })).filter((g) => g.items.length > 0);

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Evidence Strength
                </h3>
                {onInsert && (
                    <button
                        onClick={() => onInsert('strength-ladder', insights)}
                        className="text-[10px] text-muted-foreground hover:text-primary transition-colors"
                    >
                        Insert to Canvas ↗
                    </button>
                )}
            </div>
            {grouped.map(({ strength, items }) => {
                const style = STRENGTH_STYLES[strength];
                return (
                    <div key={strength} className="space-y-1">
                        <div className={`text-[10px] font-semibold uppercase tracking-wider ${style.textColor}`}>
                            {style.label}
                        </div>
                        {items.map((insight) => (
                            <Card key={insight.id} className="border-0 shadow-none">
                                <CardContent className="py-2 px-3 space-y-1.5">
                                    <p className="text-xs leading-relaxed">
                                        {insight.statement}
                                    </p>
                                    {/* Evidence bar */}
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${style.barColor}`}
                                                style={{ width: `${(insight.evidence.length / maxEvidence) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                            {insight.evidence.length} quote{insight.evidence.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    {/* First quote preview */}
                                    {insight.evidence[0] && (
                                        <p className="text-[10px] text-muted-foreground italic line-clamp-2 pl-2 border-l-2 border-border/50">
                                            {insight.evidence[0]}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                );
            })}
        </div>
    );
}
