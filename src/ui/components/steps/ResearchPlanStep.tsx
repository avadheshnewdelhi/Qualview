import { useState } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ConfidenceIndicator } from '@/components/shared/ConfidenceIndicator';
import { PromptRefiner } from '@/components/shared/PromptRefiner';
import { SuggestionPanel } from '@/components/shared/SuggestionPanel';
import { StepContextInput } from '@/components/shared/StepContextInput';
import { LogicPanel, type ReasoningFactor } from '@/components/shared/LogicPanel';
import {
    Sparkles,
    RefreshCw,
    ArrowRight,
    Layers,
    Target,
    AlertCircle
} from 'lucide-react';
import { generateCompletion, buildContextSummary } from '@/lib/openai';
import { planPrompt } from '@/lib/prompts';
import type { PlanContent, FramingContent, ConfidenceLevel } from '@/types';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function ResearchPlanStep() {
    const {
        context,
        settings,
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
    const existingPlan = getResearchObject('plan');
    const framingObj = getResearchObject('framing');
    const framing = framingObj?.content as FramingContent | undefined;

    const [plan, setPlan] = useState<PlanContent | null>(
        existingPlan?.content as PlanContent || null
    );
    const [confidence, setConfidence] = useState<ConfidenceLevel>(
        existingPlan?.confidence || 'medium'
    );
    const [suggestions, setSuggestions] = useState<string[]>(
        existingPlan?.improvementSuggestions || []
    );
    const [isEditing, setIsEditing] = useState(false);
    const [reasoning, setReasoning] = useState<ReasoningFactor[]>([]);

    const handleGenerate = async () => {
        if (!settings?.apiKey) {
            setSettingsOpen(true);
            return;
        }

        if (!framing) {
            setError('Please complete research framing first');
            return;
        }

        if (!isOnline) {
            setError('You are offline. Please reconnect to use AI features.');
            return;
        }

        setLoading(true, 'Generating research plan...');
        setError(null);

        try {
            const contextSummary = buildContextSummary(context);
            const stepCtx = getStepContext('plan');
            const fullContext = stepCtx ? `${contextSummary}\n\nAdditional context for this step:\n${stepCtx}` : contextSummary;
            const result = await generateCompletion<PlanContent & { confidence: ConfidenceLevel; improvementSuggestions: string[]; reasoning: ReasoningFactor[] }>(
                settings,
                planPrompt.system,
                planPrompt.buildUserPrompt(fullContext, framing)
            );

            const { confidence: newConfidence, improvementSuggestions, reasoning: newReasoning, ...content } = result;
            setPlan(content);
            setConfidence(newConfidence);
            setSuggestions(improvementSuggestions);
            setReasoning(newReasoning || []);
            addResearchObject('plan', content, newConfidence, improvementSuggestions);
        } catch (err) {
            console.error('Generation error:', err);
            setError(err instanceof Error ? err.message : 'Failed to generate plan');
        } finally {
            setLoading(false);
        }
    };



    const handleInsertToCanvas = () => {
        const obj = getResearchObject('plan');
        if (obj) {
            insertToCanvas(obj.id);
        }
    };

    if (!plan) {
        return (
            <div className="space-y-4">
                <div>
                    <h2 className="text-lg font-semibold">Research Plan</h2>
                    <p className="text-sm text-muted-foreground">
                        Create a detailed plan based on your research framing.
                    </p>
                </div>

                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                                <Target className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-medium">Generate Research Plan</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Based on your {framing?.researchType || 'research'} framing
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
                                disabled={!settings?.apiKey || !isOnline || !framing}
                            >
                                <Sparkles className="h-4 w-4 mr-2" />
                                Generate Plan
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">Research Plan</h2>
                    <p className="text-sm text-muted-foreground">
                        Review and refine your research plan
                    </p>
                </div>
                <ConfidenceIndicator level={confidence} />
            </div>

            <LogicPanel reasoning={reasoning} />

            <StepContextInput
                stepKey="plan"
                placeholder='e.g., "We only have 2 weeks for recruitment" or "Budget is limited to $5k"'
            />

            <Card>
                <CardContent className="pt-6 space-y-4">
                    {/* Goal */}
                    <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Research Goal
                        </label>
                        {isEditing ? (
                            <Textarea
                                value={plan.goal}
                                onChange={(e) => setPlan({ ...plan, goal: e.target.value })}
                                className="mt-1 text-sm"
                            />
                        ) : (
                            <p className="text-sm mt-1 font-medium">{plan.goal}</p>
                        )}
                    </div>

                    <Separator />

                    {/* Approach */}
                    <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Approach
                        </label>
                        {isEditing ? (
                            <Textarea
                                value={plan.approach}
                                onChange={(e) => setPlan({ ...plan, approach: e.target.value })}
                                className="mt-1 text-sm"
                            />
                        ) : (
                            <p className="text-sm mt-1">{plan.approach}</p>
                        )}
                    </div>

                    <Separator />

                    {/* Focus Areas */}
                    <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Focus Areas
                        </label>
                        <ul className="mt-2 space-y-1">
                            {plan.focusAreas.map((item, i) => (
                                <li key={i} className="text-sm flex items-start gap-2">
                                    <span className="text-primary">→</span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Risks */}
                    <div>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Risks & Limitations
                        </label>
                        <ul className="mt-2 space-y-1">
                            {plan.risksAndLimitations.map((item, i) => (
                                <li key={i} className="text-sm flex items-start gap-2">
                                    <span className="text-orange-500">⚠</span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </CardContent>
            </Card>

            {/* Prompt Refiner */}
            <PromptRefiner
                artifactType="plan"
                currentContent={plan}
                onRefined={(newContent, newConfidence, newSuggestions) => {
                    setPlan(newContent as PlanContent);
                    setConfidence(newConfidence as ConfidenceLevel);
                    setSuggestions(newSuggestions);
                }}
            />

            <SuggestionPanel
                suggestions={suggestions}
                artifactType="plan"
                label="To improve this plan"
            />

            {/* Actions */}
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleGenerate}>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Regenerate
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
                    {isEditing ? 'Done Editing' : 'Edit'}
                </Button>
                <Button variant="outline" size="sm" onClick={handleInsertToCanvas}>
                    <Layers className="h-3 w-3 mr-1" />
                    Insert to Canvas
                </Button>
            </div>

            <Separator />

            <Button className="w-full" onClick={() => setCurrentStep(3)}>
                Continue to Screener
                <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
        </div>
    );
}
