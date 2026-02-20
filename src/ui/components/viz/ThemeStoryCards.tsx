import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { InsightsContent, Theme, Insight } from '@/types';

interface ThemeStoryCardsProps {
    insights: InsightsContent;
    onInsert?: (vizType: string, data: unknown) => void;
}

const THEME_COLORS = [
    { bg: 'bg-indigo-50', border: 'border-indigo-200', dot: 'bg-indigo-500', text: 'text-indigo-700' },
    { bg: 'bg-violet-50', border: 'border-violet-200', dot: 'bg-violet-500', text: 'text-violet-700' },
    { bg: 'bg-pink-50', border: 'border-pink-200', dot: 'bg-pink-500', text: 'text-pink-700' },
    { bg: 'bg-rose-50', border: 'border-rose-200', dot: 'bg-rose-500', text: 'text-rose-700' },
    { bg: 'bg-teal-50', border: 'border-teal-200', dot: 'bg-teal-500', text: 'text-teal-700' },
    { bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500', text: 'text-amber-700' },
];

const STRENGTH_DOTS: Record<string, string> = {
    strong: 'bg-green-500',
    moderate: 'bg-blue-400',
    weak: 'bg-orange-400',
};

function getParticipantCount(theme: Theme, allInsights: Insight[]): number {
    const pIds = new Set<string>();
    const themeInsights = allInsights.filter((i) => theme.insightIds.includes(i.id));
    for (const ins of themeInsights) {
        for (const ev of ins.evidence) {
            const m = ev.match(/P(\d+)/);
            if (m) pIds.add(m[1]);
        }
    }
    return pIds.size;
}

export function ThemeStoryCards({ insights, onInsert }: ThemeStoryCardsProps) {
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Theme Stories
                </h3>
                {onInsert && (
                    <button
                        onClick={() => onInsert('theme-stories', insights)}
                        className="text-[10px] text-muted-foreground hover:text-primary transition-colors"
                    >
                        Insert to Canvas ↗
                    </button>
                )}
            </div>
            {insights.themes.map((theme, idx) => {
                const colors = THEME_COLORS[idx % THEME_COLORS.length];
                const themeInsights = insights.insights.filter((i) =>
                    theme.insightIds.includes(i.id)
                );
                const participantCount = getParticipantCount(theme, insights.insights);

                return (
                    <Card key={theme.id} className={`${colors.bg} ${colors.border} border`}>
                        <CardContent className="py-3 px-3.5 space-y-1.5">
                            <h4 className={`text-sm font-semibold ${colors.text}`}>
                                {theme.name}
                            </h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                {theme.description}
                            </p>
                            <div className="flex items-center gap-3 pt-1">
                                <div className="flex items-center gap-1">
                                    {themeInsights.map((ins) => (
                                        <span
                                            key={ins.id}
                                            className={`w-2 h-2 rounded-full ${STRENGTH_DOTS[ins.strength]}`}
                                            title={`${ins.strength}: ${ins.statement.slice(0, 60)}…`}
                                        />
                                    ))}
                                    <span className="text-[10px] text-muted-foreground ml-1">
                                        {themeInsights.length} insight{themeInsights.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                {participantCount > 0 && (
                                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                                        {participantCount} participant{participantCount !== 1 ? 's' : ''}
                                    </Badge>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
