import { useMemo } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    Cell,
    ResponsiveContainer,
    PieChart,
    Pie,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Zap,
    Lightbulb,
    TrendingUp,
    Target,
    FileText,
    ShieldCheck,
} from 'lucide-react';
import type { InsightsContent } from '@/types';

// ─── Color palette ─────────────────────────────────────────────────────────

const STRENGTH_COLORS = {
    strong: '#22c55e',   // green-500
    moderate: '#3b82f6', // blue-500
    weak: '#f97316',     // orange-500
};

const THEME_COLORS = [
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#f43f5e', // rose
    '#14b8a6', // teal
    '#f59e0b', // amber
    '#06b6d4', // cyan
    '#84cc16', // lime
];

// ─── Types ─────────────────────────────────────────────────────────────────

interface InsightsDashboardProps {
    insights: InsightsContent;
    transcriptCount: number;
}

// ─── Component ─────────────────────────────────────────────────────────────

export function InsightsDashboard({ insights, transcriptCount }: InsightsDashboardProps) {
    // ── Derived data ────────────────────────────────────────────────────

    const strengthCounts = useMemo(() => {
        const counts = { strong: 0, moderate: 0, weak: 0 };
        for (const insight of insights.insights) {
            counts[insight.strength]++;
        }
        return counts;
    }, [insights.insights]);

    const strengthData = useMemo(
        () => [
            { name: 'Strong', value: strengthCounts.strong, fill: STRENGTH_COLORS.strong },
            { name: 'Moderate', value: strengthCounts.moderate, fill: STRENGTH_COLORS.moderate },
            { name: 'Weak', value: strengthCounts.weak, fill: STRENGTH_COLORS.weak },
        ],
        [strengthCounts]
    );

    const themeData = useMemo(
        () =>
            insights.themes.map((theme, i) => ({
                name: theme.name.length > 18 ? theme.name.slice(0, 18) + '…' : theme.name,
                fullName: theme.name,
                insights: theme.insightIds.length,
                fill: THEME_COLORS[i % THEME_COLORS.length],
            })),
        [insights.themes]
    );

    const evidenceCoverage = useMemo(() => {
        const wellEvidenced = insights.insights.filter((i) => i.evidence.length >= 2).length;
        return {
            covered: wellEvidenced,
            total: insights.insights.length,
            pct: insights.insights.length > 0 ? Math.round((wellEvidenced / insights.insights.length) * 100) : 0,
        };
    }, [insights.insights]);

    // ── Render ───────────────────────────────────────────────────────────

    return (
        <div className="space-y-4">
            {/* ── Stat cards ──────────────────────────────────────── */}
            <div className="grid grid-cols-3 gap-2">
                <StatCard icon={Zap} label="Themes" value={insights.themes.length} color="text-indigo-500" />
                <StatCard icon={Lightbulb} label="Insights" value={insights.insights.length} color="text-amber-500" />
                <StatCard icon={TrendingUp} label="Opportunities" value={insights.opportunities.length} color="text-green-500" />
            </div>
            <div className="grid grid-cols-3 gap-2">
                <StatCard icon={Target} label="HMWs" value={insights.hmwPrompts.length} color="text-purple-500" />
                <StatCard icon={FileText} label="Transcripts" value={transcriptCount} color="text-blue-500" />
                <StatCard icon={ShieldCheck} label="Evidence" value={`${evidenceCoverage.pct}%`} color="text-emerald-500" />
            </div>

            {/* ── Insight Strength Distribution ────────────────────── */}
            <Card>
                <CardHeader className="py-3 pb-1">
                    <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Insight Strength
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-2">
                    {/* Horizontal segmented bar */}
                    <div className="flex h-5 rounded-full overflow-hidden mb-2">
                        {strengthData.filter((d) => d.value > 0).map((d) => (
                            <div
                                key={d.name}
                                className="transition-all"
                                style={{
                                    flex: d.value,
                                    backgroundColor: d.fill,
                                }}
                            />
                        ))}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        {strengthData.map((d) => (
                            <span key={d.name} className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.fill }} />
                                {d.name} ({d.value})
                            </span>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* ── Theme × Insights Grid ───────────────────────────── */}
            <Card>
                <CardHeader className="py-3 pb-1">
                    <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Theme Coverage
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-2">
                    <ResponsiveContainer width="100%" height={themeData.length * 36 + 8}>
                        <BarChart
                            data={themeData}
                            layout="vertical"
                            margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
                            barSize={14}
                        >
                            <XAxis type="number" hide domain={[0, 'dataMax + 1']} />
                            <YAxis
                                type="category"
                                dataKey="name"
                                width={110}
                                tick={{ fontSize: 10, fill: '#888' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                content={({ payload }) => {
                                    if (!payload?.length) return null;
                                    const d = payload[0].payload;
                                    return (
                                        <div className="bg-popover text-popover-foreground text-xs rounded-md px-2 py-1 border shadow-sm">
                                            {d.fullName}: {d.insights} insight{d.insights !== 1 ? 's' : ''}
                                        </div>
                                    );
                                }}
                            />
                            <Bar dataKey="insights" radius={[0, 4, 4, 0]}>
                                {themeData.map((entry, idx) => (
                                    <Cell key={idx} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* ── Evidence Coverage Ring ───────────────────────────── */}
            <Card>
                <CardHeader className="py-3 pb-1">
                    <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Evidence Coverage
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-2">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 flex-shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { value: evidenceCoverage.covered, fill: '#22c55e' },
                                            { value: evidenceCoverage.total - evidenceCoverage.covered, fill: '#e5e7eb' },
                                        ]}
                                        dataKey="value"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={18}
                                        outerRadius={27}
                                        startAngle={90}
                                        endAngle={-270}
                                        strokeWidth={0}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div>
                            <p className="text-sm font-medium">
                                {evidenceCoverage.covered} of {evidenceCoverage.total} insights
                            </p>
                            <p className="text-xs text-muted-foreground">
                                have ≥2 evidence quotes ({evidenceCoverage.pct}% coverage)
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ── Opportunity Spotlight ────────────────────────────── */}
            {insights.opportunities.length > 0 && (
                <Card>
                    <CardHeader className="py-3 pb-1">
                        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Top Opportunities
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 pb-2 space-y-2">
                        {insights.opportunities.slice(0, 4).map((opp, i) => (
                            <div key={i} className="flex items-start gap-2">
                                <Badge
                                    variant="outline"
                                    className="h-5 w-5 p-0 flex items-center justify-center flex-shrink-0 text-[10px] font-bold rounded-full border-green-300 text-green-700 bg-green-50"
                                >
                                    {i + 1}
                                </Badge>
                                <p className="text-xs leading-relaxed">{opp}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

// ─── Helper ────────────────────────────────────────────────────────────────

interface StatCardProps {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: number | string;
    color: string;
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
    return (
        <Card className="bg-muted/30">
            <CardContent className="py-2.5 px-3 flex flex-col items-center text-center gap-0.5">
                <Icon className={`h-3.5 w-3.5 ${color}`} />
                <span className="text-lg font-semibold leading-none">{value}</span>
                <span className="text-[10px] text-muted-foreground">{label}</span>
            </CardContent>
        </Card>
    );
}
