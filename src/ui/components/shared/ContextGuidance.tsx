import { useStore } from '@/store';
import { Lightbulb, Check, ArrowRight } from 'lucide-react';

interface GuidanceTip {
    id: string;
    label: string;
    description: string;
    satisfied: boolean;
}

export function ContextGuidance() {
    const { context, researchObjects } = useStore();

    const hasTextSources = context.sources.some(
        (s) => s.type === 'manual'
    );
    const hasFileSources = context.sources.some(
        (s) => s.type === 'file'
    );
    const hasCanvasSources = context.sources.some(
        (s) => s.type === 'canvas'
    );
    const hasMultipleSources = context.sources.length >= 2;
    const hasFraming = researchObjects.some((o) => o.type === 'framing');

    const tips: GuidanceTip[] = [
        {
            id: 'canvas',
            label: 'Select from canvas',
            description: 'Select frames, screens, or flows from your Figma file',
            satisfied: hasCanvasSources,
        },
        {
            id: 'upload',
            label: 'Upload research artifacts',
            description: 'Add briefs, PRDs, or past research reports',
            satisfied: hasFileSources,
        },
        {
            id: 'text',
            label: 'Paste key context',
            description: 'Add user quotes, stakeholder notes, or constraints',
            satisfied: hasTextSources,
        },
        {
            id: 'multiple',
            label: 'Provide multiple sources',
            description: 'More context sources improve AI confidence and output quality',
            satisfied: hasMultipleSources,
        },
    ];

    const completedCount = tips.filter((t) => t.satisfied).length;
    const allDone = completedCount === tips.length;

    // Don't show guidance if user has already moved past context
    if (hasFraming && context.sources.length > 0) {
        return null;
    }

    return (
        <div className="space-y-2 p-3 rounded-md border bg-muted/20">
            <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-medium">
                    {allDone ? 'Great context coverage!' : 'Tips for better results'}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                    {completedCount}/{tips.length}
                </span>
            </div>
            <div className="space-y-1.5">
                {tips.map((tip) => (
                    <div
                        key={tip.id}
                        className={`flex items-start gap-2 text-xs rounded px-2 py-1.5 transition-colors ${tip.satisfied
                            ? 'text-green-700 bg-green-50'
                            : 'text-muted-foreground'
                            }`}
                    >
                        {tip.satisfied ? (
                            <Check className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        ) : (
                            <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        )}
                        <div>
                            <span className="font-medium">{tip.label}</span>
                            {!tip.satisfied && (
                                <span className="block text-[11px] opacity-70">{tip.description}</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
