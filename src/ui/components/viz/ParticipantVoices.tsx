import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { InsightsContent } from '@/types';

interface ParticipantVoicesProps {
    insights: InsightsContent;
    onInsert?: (vizType: string, data: unknown) => void;
}

const ACCENT_COLORS = [
    'border-l-indigo-500',
    'border-l-violet-500',
    'border-l-pink-500',
    'border-l-rose-500',
    'border-l-teal-500',
    'border-l-amber-500',
];

export function ParticipantVoices({ insights, onInsert }: ParticipantVoicesProps) {
    // Pick the most impactful quote per theme (longest, as a proxy for depth)
    const quotes = insights.themes.map((theme, idx) => {
        const themeInsights = insights.insights.filter((i) => theme.insightIds.includes(i.id));
        let bestQuote = '';
        let bestParticipant = '';

        for (const ins of themeInsights) {
            for (const ev of ins.evidence) {
                if (ev.length > bestQuote.length) {
                    bestQuote = ev;
                    const m = ev.match(/^P(\d+)/);
                    bestParticipant = m ? `P${m[1]}` : '';
                }
            }
        }

        // Clean the quote — remove participant prefix
        const cleanedQuote = bestQuote.replace(/^P\d+:\s*/, '').replace(/^[""]|[""]$/g, '');

        return {
            theme: theme.name,
            quote: cleanedQuote,
            participant: bestParticipant,
            color: ACCENT_COLORS[idx % ACCENT_COLORS.length],
        };
    }).filter((q) => q.quote.length > 0);

    if (quotes.length === 0) return null;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Participant Voices
                </h3>
                {onInsert && (
                    <button
                        onClick={() => onInsert('participant-voices', insights)}
                        className="text-[10px] text-muted-foreground hover:text-primary transition-colors"
                    >
                        Insert to Canvas ↗
                    </button>
                )}
            </div>
            {quotes.map((q, i) => (
                <Card key={i} className={`border-l-[3px] ${q.color}`}>
                    <CardContent className="py-3 px-3.5 space-y-2">
                        <p className="text-xs italic leading-relaxed text-foreground">
                            "{q.quote}"
                        </p>
                        <div className="flex items-center justify-between">
                            {q.participant && (
                                <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                                    {q.participant}
                                </Badge>
                            )}
                            <span className="text-[10px] text-muted-foreground">
                                {q.theme}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
