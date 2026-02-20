/**
 * Dynamic Visualization Selector
 *
 * Determines which dashboard viz to show based on study type
 * (from FramingContent.researchType) and content shape
 * (derived from InsightsContent).
 */
import type { InsightsContent } from '@/types';

// ─── Content Shape ─────────────────────────────────────────────────────────

export interface ContentShape {
    themeCount: number;
    insightCount: number;
    hasStrongEvidence: boolean;
    participantIds: Set<string>;
    opportunityCount: number;
    hmwCount: number;
    avgEvidencePerInsight: number;
}

export function analyzeContent(insights: InsightsContent): ContentShape {
    const participantIds = new Set<string>();
    let totalEvidence = 0;
    for (const insight of insights.insights) {
        totalEvidence += insight.evidence.length;
        for (const ev of insight.evidence) {
            const match = ev.match(/P(\d+)/);
            if (match) participantIds.add(match[1]);
        }
    }
    return {
        themeCount: insights.themes.length,
        insightCount: insights.insights.length,
        hasStrongEvidence: insights.insights.some((i) => i.strength === 'strong'),
        participantIds,
        opportunityCount: insights.opportunities.length,
        hmwCount: insights.hmwPrompts.length,
        avgEvidencePerInsight: insights.insights.length > 0 ? totalEvidence / insights.insights.length : 0,
    };
}

// ─── Viz Registry ──────────────────────────────────────────────────────────

export type VizId =
    | 'theme-stories'
    | 'participant-heatmap'
    | 'strength-ladder'
    | 'participant-voices'
    | 'opportunity-flow';

export interface VizEntry {
    id: VizId;
    label: string;
    relevance: (shape: ContentShape) => number;
}

const VIZ_REGISTRY: VizEntry[] = [
    {
        id: 'theme-stories',
        label: 'Theme Stories',
        relevance: (s) => (s.themeCount > 0 ? 1.0 : 0),
    },
    {
        id: 'participant-heatmap',
        label: 'Participant × Theme',
        relevance: (s) => (s.participantIds.size >= 3 && s.themeCount >= 2 ? 0.9 : s.participantIds.size >= 2 ? 0.5 : 0),
    },
    {
        id: 'strength-ladder',
        label: 'Evidence Strength',
        relevance: (s) => (s.insightCount >= 2 ? 0.85 : s.insightCount >= 1 ? 0.4 : 0),
    },
    {
        id: 'participant-voices',
        label: 'Participant Voices',
        relevance: (s) => (s.avgEvidencePerInsight >= 1.5 ? 0.8 : s.avgEvidencePerInsight >= 1 ? 0.4 : 0),
    },
    {
        id: 'opportunity-flow',
        label: 'Themes → Opportunities',
        relevance: (s) => (s.opportunityCount >= 2 && s.themeCount >= 2 ? 0.75 : s.opportunityCount >= 1 ? 0.3 : 0),
    },
];

// ─── Study-type boosting ───────────────────────────────────────────────────

const STUDY_TYPE_BOOSTS: Record<string, VizId[]> = {
    generative: ['theme-stories', 'participant-voices', 'opportunity-flow'],
    exploratory: ['theme-stories', 'participant-voices', 'opportunity-flow'],
    evaluative: ['strength-ladder', 'participant-heatmap', 'theme-stories'],
    foundational: ['participant-heatmap', 'theme-stories', 'participant-voices'],
    comparative: ['participant-heatmap', 'strength-ladder', 'theme-stories'],
};

function normalizeStudyType(raw: string): string {
    const lower = raw.toLowerCase();
    for (const key of Object.keys(STUDY_TYPE_BOOSTS)) {
        if (lower.includes(key)) return key;
    }
    return 'generative'; // default
}

// ─── Selector ──────────────────────────────────────────────────────────────

export interface SelectedViz {
    id: VizId;
    label: string;
    score: number;
}

export function selectVisualizations(
    insights: InsightsContent,
    researchType: string = 'generative'
): SelectedViz[] {
    const shape = analyzeContent(insights);
    const studyType = normalizeStudyType(researchType);
    const boosted = new Set(STUDY_TYPE_BOOSTS[studyType] || []);

    return VIZ_REGISTRY
        .map((viz) => {
            const base = viz.relevance(shape);
            const boost = boosted.has(viz.id) ? 0.2 : 0;
            return { id: viz.id, label: viz.label, score: Math.min(base + boost, 1.0) };
        })
        .filter((v) => v.score > 0)
        .sort((a, b) => b.score - a.score);
}
