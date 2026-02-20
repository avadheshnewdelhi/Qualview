import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { InsightsContent } from '@/types';

interface ParticipantHeatmapProps {
    insights: InsightsContent;
    onInsert?: (vizType: string, data: unknown) => void;
}

interface HeatmapCell {
    themeId: string;
    participantId: string;
    count: number; // number of evidence quotes from this participant in this theme
}

const HEAT_COLORS = [
    'bg-transparent',  // 0
    'bg-indigo-200',   // 1
    'bg-indigo-400',   // 2+
    'bg-indigo-600',   // 3+
];

function getHeatColor(count: number): string {
    if (count === 0) return HEAT_COLORS[0];
    if (count === 1) return HEAT_COLORS[1];
    if (count === 2) return HEAT_COLORS[2];
    return HEAT_COLORS[3];
}

export function ParticipantHeatmap({ insights, onInsert }: ParticipantHeatmapProps) {
    const { participantIds, heatmap } = useMemo(() => {
        const pIds = new Set<string>();
        const cells: HeatmapCell[] = [];

        for (const theme of insights.themes) {
            const themeInsights = insights.insights.filter((i) =>
                theme.insightIds.includes(i.id)
            );
            const pCounts: Record<string, number> = {};

            for (const ins of themeInsights) {
                for (const ev of ins.evidence) {
                    const m = ev.match(/P(\d+)/);
                    if (m) {
                        pIds.add(m[1]);
                        pCounts[m[1]] = (pCounts[m[1]] || 0) + 1;
                    }
                }
            }

            // Create cells for all participants
            for (const pid of pIds) {
                cells.push({
                    themeId: theme.id,
                    participantId: pid,
                    count: pCounts[pid] || 0,
                });
            }
        }

        const sortedPIds = Array.from(pIds).sort((a, b) => Number(a) - Number(b));

        // Rebuild cells with all pIds (some may have been added after earlier themes)
        const fullCells: HeatmapCell[] = [];
        for (const theme of insights.themes) {
            const themeInsights = insights.insights.filter((i) =>
                theme.insightIds.includes(i.id)
            );
            const pCounts: Record<string, number> = {};
            for (const ins of themeInsights) {
                for (const ev of ins.evidence) {
                    const m = ev.match(/P(\d+)/);
                    if (m) pCounts[m[1]] = (pCounts[m[1]] || 0) + 1;
                }
            }
            for (const pid of sortedPIds) {
                fullCells.push({ themeId: theme.id, participantId: pid, count: pCounts[pid] || 0 });
            }
        }

        return { participantIds: sortedPIds, heatmap: fullCells };
    }, [insights]);

    if (participantIds.length < 2) return null;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Participant × Theme
                </h3>
                {onInsert && (
                    <button
                        onClick={() => onInsert('participant-heatmap', { insights, participantIds, heatmap })}
                        className="text-[10px] text-muted-foreground hover:text-primary transition-colors"
                    >
                        Insert to Canvas ↗
                    </button>
                )}
            </div>
            <Card>
                <CardContent className="py-3 px-3 overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr>
                                <th className="text-[10px] text-muted-foreground text-left pr-2 pb-1 font-normal" />
                                {participantIds.map((pid) => (
                                    <th
                                        key={pid}
                                        className="text-[10px] text-muted-foreground text-center pb-1 font-normal px-0.5"
                                        style={{ minWidth: '22px' }}
                                    >
                                        P{pid}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {insights.themes.map((theme) => (
                                <tr key={theme.id}>
                                    <td className="text-[10px] text-muted-foreground pr-2 py-0.5 max-w-[100px] truncate" title={theme.name}>
                                        {theme.name.length > 16 ? theme.name.slice(0, 16) + '…' : theme.name}
                                    </td>
                                    {participantIds.map((pid) => {
                                        const cell = heatmap.find(
                                            (c) => c.themeId === theme.id && c.participantId === pid
                                        );
                                        const count = cell?.count || 0;
                                        return (
                                            <td key={pid} className="py-0.5 px-0.5">
                                                <div
                                                    className={`w-5 h-5 rounded-sm ${getHeatColor(count)} ${count === 0 ? 'border border-border/40' : ''}`}
                                                    title={`P${pid} × ${theme.name}: ${count} quote${count !== 1 ? 's' : ''}`}
                                                />
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {/* Legend */}
                    <div className="flex items-center gap-3 mt-2 pt-1.5 border-t border-border/30">
                        <span className="text-[10px] text-muted-foreground">Evidence:</span>
                        {[
                            { label: 'None', color: 'bg-transparent border border-border/40' },
                            { label: '1', color: 'bg-indigo-200' },
                            { label: '2', color: 'bg-indigo-400' },
                            { label: '3+', color: 'bg-indigo-600' },
                        ].map((item) => (
                            <span key={item.label} className="flex items-center gap-1">
                                <span className={`w-3 h-3 rounded-sm ${item.color}`} />
                                <span className="text-[10px] text-muted-foreground">{item.label}</span>
                            </span>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
