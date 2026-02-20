import { useReducer, useMemo, useCallback } from 'react';
import { ChevronDown, ChevronRight, X, ExternalLink } from 'lucide-react';
import type { InsightsContent, Theme, Insight } from '@/types';
import { postMessage } from '@/lib/figma';

// ─── Types ──────────────────────────────────────────────────────────────────

type Strength = 'strong' | 'moderate' | 'weak';

interface DashboardState {
    activeTheme: string | null;
    activeStrengths: Set<Strength>;
    expandedInsight: string | null;
    heatmapCell: { themeId: string; pId: string } | null;
}

type Action =
    | { type: 'SET_THEME'; themeId: string | null }
    | { type: 'TOGGLE_STRENGTH'; strength: Strength }
    | { type: 'SET_EXPANDED'; insightId: string | null }
    | { type: 'SET_HEATMAP_CELL'; cell: { themeId: string; pId: string } | null }
    | { type: 'RESET' };

function reducer(state: DashboardState, action: Action): DashboardState {
    switch (action.type) {
        case 'SET_THEME':
            return {
                ...state,
                activeTheme: state.activeTheme === action.themeId ? null : action.themeId,
                heatmapCell: null,
                expandedInsight: null,
            };
        case 'TOGGLE_STRENGTH': {
            const next = new Set(state.activeStrengths);
            next.has(action.strength) ? next.delete(action.strength) : next.add(action.strength);
            return { ...state, activeStrengths: next, expandedInsight: null };
        }
        case 'SET_EXPANDED':
            return {
                ...state,
                expandedInsight: state.expandedInsight === action.insightId ? null : action.insightId,
            };
        case 'SET_HEATMAP_CELL':
            return {
                ...state,
                heatmapCell:
                    state.heatmapCell &&
                        state.heatmapCell.themeId === action.cell?.themeId &&
                        state.heatmapCell.pId === action.cell?.pId
                        ? null
                        : action.cell,
            };
        case 'RESET':
            return INITIAL_STATE;
        default:
            return state;
    }
}

const INITIAL_STATE: DashboardState = {
    activeTheme: null,
    activeStrengths: new Set<Strength>(['strong', 'moderate', 'weak']),
    expandedInsight: null,
    heatmapCell: null,
};

// ─── Colors ─────────────────────────────────────────────────────────────────

const THEME_COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#F43F5E', '#14B8A6', '#F59E0B', '#06B6D4', '#84CC16'];
const THEME_BG = ['#EEF2FF', '#F5F3FF', '#FDF2F8', '#FFF1F2', '#F0FDFA', '#FFFBEB', '#ECFEFF', '#F7FEE7'];

const STRENGTH_META: Record<Strength, { label: string; color: string; bg: string; dot: string }> = {
    strong: { label: 'Strong', color: '#16A34A', bg: '#F0FDF4', dot: '#22C55E' },
    moderate: { label: 'Moderate', color: '#2563EB', bg: '#EFF6FF', dot: '#3B82F6' },
    weak: { label: 'Weak', color: '#EA580C', bg: '#FFF7ED', dot: '#F97316' },
};

const HEATMAP_INTENSITY = ['#F3F4F6', '#C7D2FE', '#818CF8', '#4F46E5'];

// ─── Helpers ────────────────────────────────────────────────────────────────

function extractParticipants(insights: Insight[]): string[] {
    const ids = new Set<string>();
    for (const ins of insights) {
        for (const ev of ins.evidence) {
            if (ev.participantId) {
                const match = ev.participantId.match(/^P?(\d+)/i);
                if (match) ids.add(match[1]);
            }
        }
    }
    return Array.from(ids).sort((a, b) => Number(a) - Number(b));
}

function getQuotesForCell(insights: Insight[], themeInsightIds: string[], pId: string): string[] {
    const quotes: string[] = [];
    for (const ins of insights) {
        if (!themeInsightIds.includes(ins.id)) continue;
        for (const ev of ins.evidence) {
            if (ev.participantId && ev.participantId.replace(/^P/i, '') === pId) {
                quotes.push(ev.quote);
            }
        }
    }
    return quotes;
}

function countForCell(insights: Insight[], themeInsightIds: string[], pId: string): number {
    let count = 0;
    for (const ins of insights) {
        if (!themeInsightIds.includes(ins.id)) continue;
        for (const ev of ins.evidence) {
            if (ev.participantId && ev.participantId.replace(/^P/i, '') === pId) count++;
        }
    }
    return count;
}

// ─── Props ──────────────────────────────────────────────────────────────────

interface InsightsDashboardProps {
    insights: InsightsContent;
    transcriptCount: number;
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function InsightsDashboard({ insights, transcriptCount }: InsightsDashboardProps) {
    const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
    const participants = useMemo(() => extractParticipants(insights.insights), [insights.insights]);

    // ── Filtered data ────────────────────────────────────────────────────
    const filteredInsights = useMemo(() => {
        let result = insights.insights;

        // Filter by theme
        if (state.activeTheme) {
            const theme = insights.themes.find((t) => t.id === state.activeTheme);
            if (theme) result = result.filter((i) => theme.insightIds.includes(i.id));
        }

        // Filter by strength
        result = result.filter((i) => state.activeStrengths.has(i.strength));

        return result;
    }, [insights, state.activeTheme, state.activeStrengths]);

    const filteredOpportunities = useMemo(() => {
        if (!state.activeTheme) return insights.opportunities;
        const theme = insights.themes.find((t) => t.id === state.activeTheme);
        if (!theme) return insights.opportunities;
        // Match opportunities that mention theme keywords
        const words = theme.name.toLowerCase().split(/[\s/\-&]+/).filter((w) => w.length > 3);
        return insights.opportunities.filter((opp) => {
            const lower = opp.toLowerCase();
            return words.some((w) => lower.includes(w));
        });
    }, [insights, state.activeTheme]);

    // ── Stats ────────────────────────────────────────────────────────────
    const stats = useMemo(() => {
        const byStrength: Record<Strength, number> = { strong: 0, moderate: 0, weak: 0 };
        for (const ins of insights.insights) byStrength[ins.strength]++;
        return {
            themes: insights.themes.length,
            insights: insights.insights.length,
            participants: participants.length,
            opportunities: insights.opportunities.length,
            hmws: insights.hmwPrompts.length,
            byStrength,
        };
    }, [insights, participants]);

    // ── Canvas insert ────────────────────────────────────────────────────
    const handleInsertToCanvas = useCallback(() => {
        const exportData: InsightsContent = {
            themes: state.activeTheme
                ? insights.themes.filter((t) => t.id === state.activeTheme)
                : insights.themes,
            insights: filteredInsights,
            opportunities: filteredOpportunities,
            hmwPrompts: insights.hmwPrompts,
        };
        postMessage({
            type: 'INSERT_VISUALIZATION',
            payload: { vizType: 'theme-stories', data: exportData },
        });
    }, [insights, filteredInsights, filteredOpportunities, state.activeTheme]);

    const isFiltered = state.activeTheme !== null || state.activeStrengths.size < 3;

    return (
        <div className="space-y-4">
            {/* ── Summary Bar ─────────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-2">
                {[
                    { label: 'Themes', value: stats.themes },
                    { label: 'Insights', value: stats.insights },
                    { label: 'Participants', value: stats.participants },
                    { label: 'Transcripts', value: transcriptCount },
                ].map((s) => (
                    <div
                        key={s.label}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-muted/50 text-xs"
                    >
                        <span className="font-semibold text-foreground">{s.value}</span>
                        <span className="text-muted-foreground">{s.label}</span>
                    </div>
                ))}

                {/* Strength chips — clickable filters */}
                <div className="flex items-center gap-1 ml-auto">
                    {(['strong', 'moderate', 'weak'] as Strength[]).map((str) => (
                        <button
                            key={str}
                            onClick={() => dispatch({ type: 'TOGGLE_STRENGTH', strength: str })}
                            className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium border transition-all"
                            style={{
                                borderColor: state.activeStrengths.has(str) ? STRENGTH_META[str].color : '#E5E7EB',
                                backgroundColor: state.activeStrengths.has(str) ? STRENGTH_META[str].bg : 'transparent',
                                color: state.activeStrengths.has(str) ? STRENGTH_META[str].color : '#9CA3AF',
                                opacity: state.activeStrengths.has(str) ? 1 : 0.5,
                            }}
                        >
                            <span
                                className="w-1.5 h-1.5 rounded-full"
                                style={{ backgroundColor: STRENGTH_META[str].dot }}
                            />
                            {STRENGTH_META[str].label} ({stats.byStrength[str]})
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Theme Filter Pills ─────────────────────────────── */}
            <div className="flex flex-wrap gap-1.5">
                {insights.themes.map((theme, idx) => {
                    const isActive = state.activeTheme === theme.id;
                    const color = THEME_COLORS[idx % THEME_COLORS.length];
                    return (
                        <button
                            key={theme.id}
                            onClick={() => dispatch({ type: 'SET_THEME', themeId: theme.id })}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all"
                            style={{
                                borderColor: isActive ? color : '#E5E7EB',
                                backgroundColor: isActive ? THEME_BG[idx % THEME_BG.length] : 'transparent',
                                color: isActive ? color : '#6B7280',
                            }}
                        >
                            <span
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: color }}
                            />
                            {theme.name}
                            {isActive && <X className="w-3 h-3 ml-0.5 opacity-60" />}
                        </button>
                    );
                })}

                {isFiltered && (
                    <button
                        onClick={() => dispatch({ type: 'RESET' })}
                        className="px-2 py-1 rounded-full text-[10px] text-muted-foreground hover:text-foreground border border-dashed border-muted-foreground/30 hover:border-muted-foreground/60 transition-colors"
                    >
                        Clear all filters
                    </button>
                )}
            </div>

            {/* ── Interactive Heatmap ────────────────────────────── */}
            {participants.length > 0 && (
                <div className="rounded-lg border bg-card p-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-semibold text-muted-foreground tracking-wider uppercase">
                            Participant × Theme
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-[10px]" style={{ borderSpacing: 2, borderCollapse: 'separate' }}>
                            <thead>
                                <tr>
                                    <th className="text-left text-muted-foreground font-normal pr-2 pb-1 min-w-[100px]" />
                                    {participants.map((pId) => (
                                        <th key={pId} className="text-center text-muted-foreground font-normal pb-1 w-7">
                                            P{pId}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {insights.themes.map((theme, tIdx) => {
                                    const dimmed = state.activeTheme && state.activeTheme !== theme.id;
                                    return (
                                        <tr key={theme.id} style={{ opacity: dimmed ? 0.3 : 1 }}>
                                            <td className="pr-2 py-0.5 text-muted-foreground max-w-[120px] truncate">
                                                <button
                                                    onClick={() => dispatch({ type: 'SET_THEME', themeId: theme.id })}
                                                    className="text-left hover:text-foreground transition-colors"
                                                    title={theme.name}
                                                >
                                                    <span
                                                        className="inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle"
                                                        style={{ backgroundColor: THEME_COLORS[tIdx % THEME_COLORS.length] }}
                                                    />
                                                    {theme.name.length > 18 ? theme.name.slice(0, 18) + '…' : theme.name}
                                                </button>
                                            </td>
                                            {participants.map((pId) => {
                                                const count = countForCell(insights.insights, theme.insightIds, pId);
                                                const intensity = Math.min(count, 3);
                                                const isSelected =
                                                    state.heatmapCell?.themeId === theme.id &&
                                                    state.heatmapCell?.pId === pId;
                                                return (
                                                    <td key={pId} className="p-0.5">
                                                        <button
                                                            onClick={() =>
                                                                count > 0 &&
                                                                dispatch({
                                                                    type: 'SET_HEATMAP_CELL',
                                                                    cell: { themeId: theme.id, pId },
                                                                })
                                                            }
                                                            className="w-6 h-6 rounded transition-all"
                                                            style={{
                                                                backgroundColor: HEATMAP_INTENSITY[intensity],
                                                                outline: isSelected ? '2px solid #4F46E5' : 'none',
                                                                outlineOffset: 1,
                                                                cursor: count > 0 ? 'pointer' : 'default',
                                                            }}
                                                            title={count > 0 ? `P${pId} × ${theme.name}: ${count} quote${count !== 1 ? 's' : ''}` : ''}
                                                        />
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-3 mt-2 text-[9px] text-muted-foreground">
                        <span>Evidence:</span>
                        {['None', '1', '2', '3+'].map((label, i) => (
                            <span key={label} className="flex items-center gap-1">
                                <span
                                    className="w-3 h-3 rounded-sm inline-block"
                                    style={{ backgroundColor: HEATMAP_INTENSITY[i] }}
                                />
                                {label}
                            </span>
                        ))}
                    </div>

                    {/* Heatmap cell popover */}
                    {state.heatmapCell && (
                        <HeatmapQuotePanel
                            cell={state.heatmapCell}
                            insights={insights}
                            onClose={() => dispatch({ type: 'SET_HEATMAP_CELL', cell: null })}
                        />
                    )}
                </div>
            )}

            {/* ── Insights Cards ──────────────────────────────────── */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold text-muted-foreground tracking-wider uppercase">
                        Insights
                        {isFiltered && (
                            <span className="ml-1 font-normal">
                                ({filteredInsights.length} of {insights.insights.length})
                            </span>
                        )}
                    </span>
                    <button
                        onClick={handleInsertToCanvas}
                        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Insert to Canvas <ExternalLink className="w-3 h-3" />
                    </button>
                </div>

                {filteredInsights.length === 0 ? (
                    <div className="text-center text-xs text-muted-foreground py-6 border border-dashed rounded-md">
                        No insights match current filters
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredInsights.map((insight) => (
                            <InsightCard
                                key={insight.id}
                                insight={insight}
                                themes={insights.themes}
                                expanded={state.expandedInsight === insight.id}
                                onToggle={() =>
                                    dispatch({ type: 'SET_EXPANDED', insightId: insight.id })
                                }
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ── Opportunities ───────────────────────────────────── */}
            {filteredOpportunities.length > 0 && (
                <div>
                    <span className="text-[10px] font-semibold text-muted-foreground tracking-wider uppercase block mb-2">
                        Opportunities
                        {state.activeTheme && (
                            <span className="font-normal ml-1">
                                ({filteredOpportunities.length} of {insights.opportunities.length})
                            </span>
                        )}
                    </span>
                    <div className="space-y-1.5">
                        {filteredOpportunities.map((opp, i) => (
                            <div key={i} className="flex gap-2 items-start py-2 px-3 rounded-md border bg-card text-xs">
                                <span className="text-muted-foreground mt-px flex-shrink-0">{i + 1}.</span>
                                <span>{opp}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── HMW Prompts ─────────────────────────────────────── */}
            {insights.hmwPrompts.length > 0 && (
                <div>
                    <span className="text-[10px] font-semibold text-muted-foreground tracking-wider uppercase block mb-2">
                        How Might We…
                    </span>
                    <div className="space-y-1">
                        {insights.hmwPrompts.map((hmw, i) => (
                            <div key={i} className="py-1.5 px-3 rounded-md bg-muted/30 text-xs text-muted-foreground italic">
                                {hmw}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function InsightCard({
    insight,
    themes,
    expanded,
    onToggle,
}: {
    insight: Insight;
    themes: Theme[];
    expanded: boolean;
    onToggle: () => void;
}) {
    const meta = STRENGTH_META[insight.strength];
    const parentTheme = themes.find((t) => t.insightIds.includes(insight.id));
    const themeIdx = parentTheme ? themes.indexOf(parentTheme) : 0;
    const themeColor = THEME_COLORS[themeIdx % THEME_COLORS.length];

    return (
        <div
            className="rounded-lg border bg-card overflow-hidden transition-all"
            style={{ borderLeftWidth: 3, borderLeftColor: themeColor }}
        >
            <button
                onClick={onToggle}
                className="w-full text-left px-3 py-2.5 flex items-start gap-2 hover:bg-muted/30 transition-colors"
            >
                {expanded
                    ? <ChevronDown className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-muted-foreground" />
                    : <ChevronRight className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-muted-foreground" />
                }
                <div className="flex-1 min-w-0">
                    <p className="text-xs leading-relaxed">{insight.statement}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                        <span
                            className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                            style={{ backgroundColor: meta.bg, color: meta.color }}
                        >
                            {meta.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                            {insight.evidence.length} quote{insight.evidence.length !== 1 ? 's' : ''}
                        </span>
                        {parentTheme && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <span
                                    className="w-1.5 h-1.5 rounded-full inline-block"
                                    style={{ backgroundColor: themeColor }}
                                />
                                {parentTheme.name}
                            </span>
                        )}
                    </div>
                </div>
            </button>

            {expanded && (
                <div className="px-3 pb-3 pt-1 border-t bg-muted/20">
                    <div className="space-y-2">
                        {insight.evidence.map((ev, i) => {
                            const pId = ev.participantId || '';
                            const quote = ev.quote;
                            return (
                                <div key={i} className="flex gap-2 items-start">
                                    {pId && (
                                        <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded flex-shrink-0">
                                            {pId}
                                        </span>
                                    )}
                                    <div className="flex-1">
                                        <p className="text-[11px] text-muted-foreground italic leading-relaxed">
                                            &ldquo;{quote}&rdquo;
                                        </p>
                                        {(ev.emotion || ev.sentiment || (ev.tags && ev.tags.length > 0)) && (
                                            <div className="flex flex-wrap gap-1 mt-1.5">
                                                {ev.emotion && (
                                                    <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                                                        {ev.emotion}
                                                    </span>
                                                )}
                                                {ev.sentiment && (
                                                    <span className="text-[9px] px-1.5 py-0.5 rounded-sm bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                                                        {ev.sentiment}
                                                    </span>
                                                )}
                                                {ev.tags?.map(tag => (
                                                    <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground border">
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

function HeatmapQuotePanel({
    cell,
    insights,
    onClose,
}: {
    cell: { themeId: string; pId: string };
    insights: InsightsContent;
    onClose: () => void;
}) {
    const theme = insights.themes.find((t) => t.id === cell.themeId);
    if (!theme) return null;
    const quotes = getQuotesForCell(insights.insights, theme.insightIds, cell.pId);
    const themeIdx = insights.themes.indexOf(theme);
    const color = THEME_COLORS[themeIdx % THEME_COLORS.length];

    if (quotes.length === 0) return null;

    return (
        <div className="mt-2 rounded-md border bg-muted/20 p-3" style={{ borderLeftWidth: 3, borderLeftColor: color }}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold bg-muted px-1.5 py-0.5 rounded text-[10px]">P{cell.pId}</span>
                    <span className="text-muted-foreground">×</span>
                    <span className="font-medium" style={{ color }}>{theme.name}</span>
                </div>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
            <div className="space-y-1.5">
                {quotes.map((q, i) => (
                    <p key={i} className="text-[11px] text-muted-foreground italic leading-relaxed">
                        &ldquo;{q}&rdquo;
                    </p>
                ))}
            </div>
        </div>
    );
}
