import { useMemo, useCallback } from 'react';
import { useStore } from '@/store';
import { selectVisualizations, type VizId } from '@/lib/vizSelector';
import { ThemeStoryCards } from '@/components/viz/ThemeStoryCards';
import { ParticipantHeatmap } from '@/components/viz/ParticipantHeatmap';
import { StrengthLadder } from '@/components/viz/StrengthLadder';
import { ParticipantVoices } from '@/components/viz/ParticipantVoices';
import { OpportunityFlow } from '@/components/viz/OpportunityFlow';
import type { InsightsContent, FramingContent } from '@/types';
import { postMessage } from '@/lib/figma';

// ─── Component map ─────────────────────────────────────────────────────────

const VIZ_COMPONENTS: Record<VizId, React.ComponentType<{
    insights: InsightsContent;
    onInsert?: (vizType: string, data: unknown) => void;
}>> = {
    'theme-stories': ThemeStoryCards,
    'participant-heatmap': ParticipantHeatmap,
    'strength-ladder': StrengthLadder,
    'participant-voices': ParticipantVoices,
    'opportunity-flow': OpportunityFlow,
};

// ─── Props ─────────────────────────────────────────────────────────────────

interface InsightsDashboardProps {
    insights: InsightsContent;
    transcriptCount: number;
}

// ─── Component ─────────────────────────────────────────────────────────────

export function InsightsDashboard({ insights, transcriptCount }: InsightsDashboardProps) {
    // Get research type from framing
    const framing = useStore((s) =>
        s.researchObjects.find((o) => o.type === 'framing')
    );
    const researchType = (framing?.content as FramingContent | undefined)?.researchType || 'generative';

    // Select visualizations based on study type and content
    const selectedViz = useMemo(
        () => selectVisualizations(insights, researchType),
        [insights, researchType]
    );

    // Canvas insertion handler
    const handleInsert = useCallback((vizType: string, data: unknown) => {
        postMessage({
            type: 'INSERT_VISUALIZATION',
            payload: { vizType, data },
        });
    }, []);

    if (selectedViz.length === 0) {
        return (
            <div className="text-center py-8 text-sm text-muted-foreground">
                Not enough data to generate visualizations yet.
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Study type badge */}
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span>Visualizations selected for</span>
                <span className="px-1.5 py-0.5 rounded bg-muted font-medium">{researchType}</span>
                <span>study</span>
                <span className="mx-1">·</span>
                <span>{transcriptCount} transcript{transcriptCount !== 1 ? 's' : ''}</span>
            </div>

            {/* Render selected viz in score order */}
            {selectedViz.map((viz) => {
                const Component = VIZ_COMPONENTS[viz.id];
                if (!Component) return null;
                return (
                    <Component
                        key={viz.id}
                        insights={insights}
                        onInsert={handleInsert}
                    />
                );
            })}
        </div>
    );
}
