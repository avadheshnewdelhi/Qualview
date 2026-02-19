import { useState } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ConfidenceIndicator } from '@/components/shared/ConfidenceIndicator';
import { PromptRefiner } from '@/components/shared/PromptRefiner';
import { SuggestionPanel } from '@/components/shared/SuggestionPanel';
import { LogicPanel, type ReasoningFactor } from '@/components/shared/LogicPanel';
import {
    Sparkles,
    RefreshCw,
    ArrowRight,
    Layers,
    MessageSquare,
    AlertCircle
} from 'lucide-react';
import { generateCompletion, buildContextSummary } from '@/lib/openai';
import { interviewPrompt } from '@/lib/prompts';
import type { InterviewGuideContent, PlanContent, FramingContent, ConfidenceLevel } from '@/types';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

const SECTION_LABELS = {
    warmup: { label: 'Warm-up', color: 'bg-green-100 text-green-800' },
    core: { label: 'Core Questions', color: 'bg-blue-100 text-blue-800' },
    wrapup: { label: 'Wrap-up', color: 'bg-purple-100 text-purple-800' },
};

export function InterviewGuideStep() {
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
    const existingGuide = getResearchObject('interview-guide');
    const planObj = getResearchObject('plan');
    const framingObj = getResearchObject('framing');
    const plan = planObj?.content as PlanContent | undefined;
    const framing = framingObj?.content as FramingContent | undefined;

    const [guide, setGuide] = useState<InterviewGuideContent | null>(
        existingGuide?.content as InterviewGuideContent || null
    );
    const [confidence, setConfidence] = useState<ConfidenceLevel>(
        existingGuide?.confidence || 'medium'
    );
    const [suggestions, setSuggestions] = useState<string[]>(
        existingGuide?.improvementSuggestions || []
    );
    const [reasoning, setReasoning] = useState<ReasoningFactor[]>([]);

    const handleGenerate = async () => {
        if (!settings?.apiKey) {
            setSettingsOpen(true);
            return;
        }

        if (!plan || !framing) {
            setError('Please complete research framing and plan first');
            return;
        }

        if (!isOnline) {
            setError('You are offline. Please reconnect to use AI features.');
            return;
        }

        setLoading(true, 'Generating interview guide...');
        setError(null);

        try {
            const contextSummary = buildContextSummary(context);
            const result = await generateCompletion<InterviewGuideContent & { confidence: ConfidenceLevel; improvementSuggestions: string[]; reasoning: ReasoningFactor[] }>(
                settings,
                interviewPrompt.system,
                interviewPrompt.buildUserPrompt(contextSummary, framing, plan)
            );

            const { confidence: newConfidence, improvementSuggestions, reasoning: newReasoning, ...content } = result;
            setGuide(content);
            setConfidence(newConfidence);
            setSuggestions(improvementSuggestions);
            setReasoning(newReasoning || []);
            addResearchObject('interview-guide', content, newConfidence, improvementSuggestions);
        } catch (err) {
            console.error('Generation error:', err);
            setError(err instanceof Error ? err.message : 'Failed to generate interview guide');
        } finally {
            setLoading(false);
        }
    };



    const handleInsertToCanvas = () => {
        const obj = getResearchObject('interview-guide');
        if (obj) {
            insertToCanvas(obj.id);
        }
    };

    if (!guide) {
        return (
            <div className="space-y-4">
                <div>
                    <h2 className="text-lg font-semibold">Interview Guide</h2>
                    <p className="text-sm text-muted-foreground">
                        Generate a structured interview guide with neutral, bias-free questions.
                    </p>
                </div>

                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center space-y-4">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                                <MessageSquare className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-medium">Generate Interview Guide</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Create warm-up, core, and wrap-up questions with probes
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
                                disabled={!settings?.apiKey || !isOnline || !plan}
                            >
                                <Sparkles className="h-4 w-4 mr-2" />
                                Generate Interview Guide
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
                    <h2 className="text-lg font-semibold">Interview Guide</h2>
                    <p className="text-sm text-muted-foreground">
                        {guide.sections.reduce((acc, s) => acc + s.questions.length, 0)} questions across {guide.sections.length} sections
                    </p>
                </div>
                <ConfidenceIndicator level={confidence} />
            </div>

            <LogicPanel reasoning={reasoning} />

            {guide.sections.map((section, sectionIdx) => (
                <Card key={sectionIdx}>
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Badge className={SECTION_LABELS[section.type].color}>
                                {SECTION_LABELS[section.type].label}
                            </Badge>
                            <span className="text-muted-foreground text-xs">
                                {section.questions.length} questions
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-4">
                        {section.questions.map((q, qIdx) => (
                            <div key={q.id} className="space-y-2">
                                <div className="flex items-start gap-2">
                                    <span className="text-xs text-muted-foreground font-mono w-6">
                                        {sectionIdx + 1}.{qIdx + 1}
                                    </span>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{q.question}</p>

                                        {q.probes.length > 0 && (
                                            <div className="mt-2 pl-3 border-l-2 border-muted space-y-1">
                                                <span className="text-xs text-muted-foreground uppercase tracking-wide">Probes:</span>
                                                {q.probes.map((probe, pIdx) => (
                                                    <p key={pIdx} className="text-xs text-muted-foreground italic">
                                                        → {probe}
                                                    </p>
                                                ))}
                                            </div>
                                        )}

                                        {q.notes && (
                                            <p className="text-xs text-muted-foreground mt-2 bg-muted p-2 rounded">
                                                📝 {q.notes}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {qIdx < section.questions.length - 1 && (
                                    <Separator className="my-2" />
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            ))}

            {/* Prompt Refiner */}
            <PromptRefiner
                artifactType="interview-guide"
                currentContent={guide}
                onRefined={(newContent, newConfidence, newSuggestions) => {
                    setGuide(newContent as InterviewGuideContent);
                    setConfidence(newConfidence as ConfidenceLevel);
                    setSuggestions(newSuggestions);
                }}
            />

            <SuggestionPanel
                suggestions={suggestions}
                artifactType="interview-guide"
                currentContent={guide}
                onApplied={(newContent, newConf, newSuggestions) => {
                    const conf = newConf as ConfidenceLevel;
                    setGuide(newContent as InterviewGuideContent);
                    setConfidence(conf);
                    setSuggestions(newSuggestions);
                    addResearchObject('interview-guide', newContent, conf, newSuggestions);
                }}
                label="To improve this guide"
            />

            {/* Actions */}
            <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleGenerate}>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Regenerate
                </Button>
                <Button variant="outline" size="sm" onClick={handleInsertToCanvas}>
                    <Layers className="h-3 w-3 mr-1" />
                    Insert to Canvas
                </Button>
            </div>

            <Separator />

            <Button className="w-full" onClick={() => setCurrentStep(6)}>
                Synthesis
                <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
        </div>
    );
}
