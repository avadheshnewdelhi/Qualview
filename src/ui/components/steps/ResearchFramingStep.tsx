import { useState } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ConfidenceIndicator } from '@/components/shared/ConfidenceIndicator';
import { EditableCard } from '@/components/shared/EditableCard';
import { EditPanel } from '@/components/shared/EditPanel';
import { SuggestionPanel } from '@/components/shared/SuggestionPanel';
import { LogicPanel, type ReasoningFactor } from '@/components/shared/LogicPanel';
import {
    Sparkles,
    ArrowRight,
    Layers,
    AlertCircle
} from 'lucide-react';
import { generateCompletion, buildContextSummary } from '@/lib/openai';
import { framingPrompt } from '@/lib/prompts';
import type { FramingContent, ConfidenceLevel } from '@/types';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function ResearchFramingStep() {
    const {
        context,
        settings,
        setLoading,
        setError,
        addResearchObject,
        getResearchObject,
        insertToCanvas,
        setCurrentStep,
        setSettingsOpen
    } = useStore();

    const isOnline = useOnlineStatus();
    const existingFraming = getResearchObject('framing');

    const [framing, setFraming] = useState<FramingContent | null>(
        existingFraming?.content as FramingContent || null
    );
    const [confidence, setConfidence] = useState<ConfidenceLevel>(
        existingFraming?.confidence || 'medium'
    );
    const [suggestions, setSuggestions] = useState<string[]>(
        existingFraming?.improvementSuggestions || []
    );
    const [isEditing, setIsEditing] = useState(false);
    const [reasoning, setReasoning] = useState<ReasoningFactor[]>([]);

    const handleGenerate = async () => {
        if (!settings?.apiKey) {
            setSettingsOpen(true);
            return;
        }

        if (!isOnline) {
            setError('You are offline. Please reconnect to use AI features.');
            return;
        }

        setLoading(true, 'Generating research framing...');
        setError(null);

        try {
            const contextSummary = buildContextSummary(context);
            const result = await generateCompletion<FramingContent & { confidence: ConfidenceLevel; improvementSuggestions: string[]; reasoning: ReasoningFactor[] }>(
                settings,
                framingPrompt.system,
                framingPrompt.buildUserPrompt(contextSummary)
            );

            const { confidence: newConfidence, improvementSuggestions, reasoning: newReasoning, ...content } = result;
            setFraming(content);
            setConfidence(newConfidence);
            setSuggestions(improvementSuggestions);
            setReasoning(newReasoning || []);
            addResearchObject('framing', content, newConfidence, improvementSuggestions);
        } catch (err) {
            console.error('Generation error:', err);
            setError(err instanceof Error ? err.message : 'Failed to generate framing');
        } finally {
            setLoading(false);
        }
    };

    const handleInsertToCanvas = () => {
        const obj = getResearchObject('framing');
        if (obj) {
            insertToCanvas(obj.id);
        }
    };

    if (!framing) {
        return (
            <div className="space-y-4">
                <div>
                    <h2 className="text-lg font-semibold">Research Framing</h2>
                    <p className="text-sm text-muted-foreground">
                        Let AI analyze your context and recommend the best research approach.
                    </p>
                </div>

                <EditableCard
                    isEditing={false}
                    onEditToggle={() => { }}
                    showEditIcon={false}
                >
                    <div className="text-center space-y-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                            <Sparkles className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-medium">Generate Research Framing</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Based on {context.sources.length} context source(s)
                            </p>
                        </div>

                        {!settings?.apiKey && (
                            <div className="p-3 bg-amber-50 text-amber-800 rounded-md text-sm flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                <span>Add your OpenAI API key in settings first</span>
                            </div>
                        )}

                        <Button
                            onClick={handleGenerate}
                            className="w-full"
                            disabled={!settings?.apiKey || !isOnline}
                        >
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generate Framing
                        </Button>
                    </div>
                </EditableCard>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">Research Framing</h2>
                    <p className="text-sm text-muted-foreground">
                        Review and edit your research approach
                    </p>
                </div>
                <ConfidenceIndicator level={confidence} />
            </div>

            <LogicPanel reasoning={reasoning} />

            <EditableCard
                isEditing={isEditing}
                onEditToggle={setIsEditing}
                headerContent={<Badge variant="secondary">{framing.researchType}</Badge>}
                editPanel={
                    <EditPanel
                        stepKey="framing"
                        artifactType="framing"
                        currentContent={framing}
                        onUpdated={(newContent, newConf, newSuggestions) => {
                            setFraming(newContent as FramingContent);
                            setConfidence(newConf as ConfidenceLevel);
                            setSuggestions(newSuggestions);
                            addResearchObject('framing', newContent, newConf as ConfidenceLevel, newSuggestions);
                        }}
                    />
                }
            >
                {/* Rationale */}
                <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Rationale
                    </label>
                    {isEditing ? (
                        <Textarea
                            value={framing.rationale}
                            onChange={(e) => setFraming({ ...framing, rationale: e.target.value })}
                            className="mt-1 text-sm"
                        />
                    ) : (
                        <p className="text-sm mt-1">{framing.rationale}</p>
                    )}
                </div>

                <Separator />

                {/* Will Answer */}
                <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        This research will answer
                    </label>
                    <ul className="mt-2 space-y-1">
                        {framing.willAnswer.map((item, i) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                                <span className="text-green-500">✓</span>
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Will NOT Answer */}
                <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        This research will NOT answer
                    </label>
                    <ul className="mt-2 space-y-1">
                        {framing.willNotAnswer.map((item, i) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                                <span className="text-orange-500">✗</span>
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Assumptions */}
                <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Key Assumptions
                    </label>
                    <ul className="mt-2 space-y-1">
                        {framing.assumptions.map((item, i) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                                <span className="text-muted-foreground">•</span>
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            </EditableCard>

            <SuggestionPanel
                suggestions={suggestions}
                artifactType="framing"
                label="To improve confidence"
            />

            <Separator />

            {/* CTA area: Insert to Canvas + Continue */}
            <div className="flex gap-2">
                <Button variant="outline" onClick={handleInsertToCanvas}>
                    <Layers className="h-4 w-4 mr-2" />
                    Insert to Canvas
                </Button>
                <Button className="flex-1" onClick={() => setCurrentStep(2)}>
                    Continue to Plan
                    <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
            </div>
        </div>
    );
}
