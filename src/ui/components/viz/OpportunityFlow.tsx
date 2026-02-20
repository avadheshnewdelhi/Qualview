import { Card, CardContent } from '@/components/ui/card';
import type { InsightsContent } from '@/types';

interface OpportunityFlowProps {
    insights: InsightsContent;
    onInsert?: (vizType: string, data: unknown) => void;
}

const THEME_DOT_COLORS = [
    'bg-indigo-500',
    'bg-violet-500',
    'bg-pink-500',
    'bg-rose-500',
    'bg-teal-500',
    'bg-amber-500',
];

function matchThemes(opportunity: string, themes: InsightsContent['themes']): number[] {
    const oppLower = opportunity.toLowerCase();
    const matched: number[] = [];
    for (let i = 0; i < themes.length; i++) {
        // Check if any significant word from theme name appears in the opportunity
        const themeWords = themes[i].name
            .toLowerCase()
            .split(/[\s/\-&]+/)
            .filter((w) => w.length > 3); // skip short words like "and", "the"
        const hasMatch = themeWords.some((word) => oppLower.includes(word));
        if (hasMatch) matched.push(i);
    }
    return matched;
}

export function OpportunityFlow({ insights, onInsert }: OpportunityFlowProps) {
    if (insights.opportunities.length === 0 || insights.themes.length === 0) return null;

    const items = insights.opportunities.map((opp, i) => ({
        index: i,
        text: opp,
        themeIndices: matchThemes(opp, insights.themes),
    }));

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Themes → Opportunities
                </h3>
                {onInsert && (
                    <button
                        onClick={() => onInsert('opportunity-flow', insights)}
                        className="text-[10px] text-muted-foreground hover:text-primary transition-colors"
                    >
                        Insert to Canvas ↗
                    </button>
                )}
            </div>

            {/* Theme legend */}
            <div className="flex flex-wrap gap-2 mb-1">
                {insights.themes.map((theme, i) => (
                    <span key={theme.id} className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${THEME_DOT_COLORS[i % THEME_DOT_COLORS.length]}`} />
                        <span className="text-[10px] text-muted-foreground">
                            {theme.name.length > 20 ? theme.name.slice(0, 20) + '…' : theme.name}
                        </span>
                    </span>
                ))}
            </div>

            {items.map((item) => (
                <Card key={item.index}>
                    <CardContent className="py-2.5 px-3 space-y-1.5">
                        <p className="text-xs leading-relaxed">{item.text}</p>
                        {item.themeIndices.length > 0 && (
                            <div className="flex items-center gap-1">
                                <span className="text-[10px] text-muted-foreground">addresses:</span>
                                {item.themeIndices.map((ti) => (
                                    <span
                                        key={ti}
                                        className={`w-2.5 h-2.5 rounded-full ${THEME_DOT_COLORS[ti % THEME_DOT_COLORS.length]}`}
                                        title={insights.themes[ti].name}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
