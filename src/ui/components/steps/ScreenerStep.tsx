import { useState } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ConfidenceIndicator } from '@/components/shared/ConfidenceIndicator';
import { EditableCard } from '@/components/shared/EditableCard';
import { EditPanel } from '@/components/shared/EditPanel';
import { SuggestionPanel } from '@/components/shared/SuggestionPanel';
import { BiasCheckPanel } from '@/components/shared/BiasCheckPanel';
import { LogicPanel, type ReasoningFactor } from '@/components/shared/LogicPanel';
import {
    Sparkles,
    ArrowRight,
    Layers,
    ClipboardList,
    AlertCircle
} from 'lucide-react';
import { generateCompletion, buildContextSummary } from '@/lib/openai';
import { screenerPrompt } from '@/lib/prompts';
import type { ScreenerContent, PlanContent, ConfidenceLevel } from '@/types';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

const QUESTION_TYPE_COLORS = {
    scenario: 'bg-blue-100 text-blue-800',
    indirect: 'bg-purple-100 text-purple-800',
    validation: 'bg-green-100 text-green-800',
    knockout: 'bg-red-100 text-red-800',
};

export function ScreenerStep() {
    const {
        context,
        settings, isSignedIn,
        setLoading,
        setError,
        addResearchObject,
        getResearchObject,
        insertToCanvas,
        setCurrentStep,
        setSettingsOpen,
        getStepContext
    } = useStore();

    const isOnline = useOnlineStatus();
    const existingScreener = getResearchObject('screener');
    const planObj = getResearchObject('plan');
    const plan = planObj?.content as PlanContent | undefined;

    const [screener, setScreener] = useState<ScreenerContent | null>(
        existingScreener?.content as ScreenerContent || null
    );
    const [confidence, setConfidence] = useState<ConfidenceLevel>(
        existingScreener?.confidence || 'medium'
    );
    const [suggestions, setSuggestions] = useState<string[]>(
        existingScreener?.improvementSuggestions || []
    );
    const [isEditing, setIsEditing] = useState(false);
    const [reasoning, setReasoning] = useState<ReasoningFactor[]>([]);

    const handleGenerate = async () => {
        if (!isSignedIn) {
            setSettingsOpen(true);
            return;
        }

        if (!plan) {
            setError('Please complete research plan first');
            return;
        }

        if (!isOnline) {
            setError('You are offline. Please reconnect to use AI features.');
            return;
        }

        setLoading(true, 'Generating screener questions...');
        setError(null);

        try {
            const contextSummary = buildContextSummary(context);
            const stepCtx = getStepContext('screener');
            const fullContext = stepCtx ? `${contextSummary}\n\nAdditional context for this step:\n${stepCtx}` : contextSummary;
            const result = await generateCompletion<ScreenerContent & { confidence: ConfidenceLevel; improvementSuggestions: string[]; reasoning: ReasoningFactor[] }>(
                settings,
                screenerPrompt.system,
                screenerPrompt.buildUserPrompt(fullContext, plan)
            );

            const { confidence: newConfidence, improvementSuggestions, reasoning: newReasoning, ...content } = result;
            setScreener(content);
            setConfidence(newConfidence);
            setSuggestions(improvementSuggestions);
            setReasoning(newReasoning || []);
            addResearchObject('screener', content, newConfidence, improvementSuggestions);
        } catch (err) {
            console.error('Generation error:', err);
            setError(err instanceof Error ? err.message : 'Failed to generate screener');
        } finally {
            setLoading(false);
        }
    };

    const handleInsertToCanvas = () => {
        const obj = getResearchObject('screener');
        if (obj) {
            insertToCanvas(obj.id);
        }
    };

    if (!screener) {
        return (
            <div className="space-y-4">
                <div>
                    <h2 className="text-lg font-semibold">Screener Questions</h2>
                    <p className="text-sm text-muted-foreground">
                        Generate bias-resistant screener questions to find the right participants.
                    </p>
                </div>

                <EditableCard
                    isEditing={false}
                    onEditToggle={() => { }}
                    showEditIcon={false}
                >
                    <div className="text-center space-y-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                            <ClipboardList className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-medium">Generate Screener Questions</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                AI will create indirect, scenario-based questions to reduce gaming
                            </p>
                        </div>

                        {!isSignedIn && (
                            <div className="p-3 bg-amber-50 text-amber-800 rounded-md text-sm flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                <span>Sign in to use AI features</span>
                            </div>
                        )}

                        <Button
                            onClick={handleGenerate}
                            className="w-full"
                            disabled={!isSignedIn || !isOnline || !plan}
                        >
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generate Screener
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
                    <h2 className="text-lg font-semibold">Screener Questions</h2>
                    <p className="text-sm text-muted-foreground">
                        {screener.questions.length} questions generated
                    </p>
                </div>
                <ConfidenceIndicator level={confidence} />
            </div>

            <LogicPanel reasoning={reasoning} />

            <EditableCard
                isEditing={isEditing}
                onEditToggle={setIsEditing}
                headerContent={
                    <span className="text-xs text-muted-foreground">
                        {screener.questions.length} questions
                    </span>
                }
                editPanel={
                    <EditPanel
                        stepKey="screener"
                        artifactType="screener"
                        currentContent={screener}
                        onUpdated={(newContent, newConf, newSuggestions) => {
                            setScreener(newContent as ScreenerContent);
                            setConfidence(newConf as ConfidenceLevel);
                            setSuggestions(newSuggestions);
                            addResearchObject('screener', newContent, newConf as ConfidenceLevel, newSuggestions);
                        }}
                        placeholder='e.g., "Add a knockout question about competitor usage" or "Make Q3 less leading"'
                        contextPlaceholder='e.g., "Participants must use iOS, not Android" or "Exclude competitor employees"'
                    />
                }
            >
                <div className="space-y-3">
                    {screener.questions.map((q, index) => (
                        <Card key={q.id}>
                            <CardHeader className="py-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">Q{index + 1}</span>
                                    <Badge className={QUESTION_TYPE_COLORS[q.questionType]}>
                                        {q.questionType}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0 space-y-2">
                                <p className="text-sm font-medium">{q.question}</p>

                                {q.options && q.options.length > 0 && (
                                    <div className="text-xs text-muted-foreground">
                                        <span className="font-medium">Options: </span>
                                        {q.options.join(' | ')}
                                    </div>
                                )}

                                {q.knockoutLogic && (
                                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                                        <span className="font-medium">Knockout: </span>
                                        {q.knockoutLogic}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </EditableCard>

            <SuggestionPanel
                suggestions={suggestions}
                artifactType="screener"
                currentContent={screener}
                mode="apply"
                onApplied={(newContent, newConf, newSuggestions) => {
                    const conf = newConf as ConfidenceLevel;
                    setScreener(newContent as ScreenerContent);
                    setConfidence(conf);
                    setSuggestions(newSuggestions);
                    addResearchObject('screener', newContent, conf, newSuggestions);
                }}
                label="To improve this screener"
            />

            {/* Bias Check */}
            <BiasCheckPanel
                artifactType="screener"
                currentContent={screener}
                onFixed={(newContent, newConf, newSuggestions) => {
                    const conf = newConf as ConfidenceLevel;
                    setScreener(newContent as ScreenerContent);
                    setConfidence(conf);
                    setSuggestions(newSuggestions);
                    addResearchObject('screener', newContent, conf, newSuggestions);
                }}
            />

            <Separator />

            {/* CTA area: Insert to Canvas + Continue */}
            <div className="flex gap-2">
                <Button variant="outline" onClick={handleInsertToCanvas}>
                    <Layers className="h-4 w-4 mr-2" />
                    Insert to Canvas
                </Button>
                <Button className="flex-1" onClick={() => setCurrentStep(4)}>
                    Evaluate Responses
                    <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
            </div>
        </div>
    );
}
