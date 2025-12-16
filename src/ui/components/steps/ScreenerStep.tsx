import { useState } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ConfidenceIndicator } from '@/components/shared/ConfidenceIndicator';
import {
    Sparkles,
    RefreshCw,
    Save,
    ArrowRight,
    Layers,
    Lightbulb,
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

    const handleGenerate = async () => {
        if (!settings?.apiKey) {
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
            const result = await generateCompletion<ScreenerContent & { confidence: ConfidenceLevel; improvementSuggestions: string[] }>(
                settings,
                screenerPrompt.system,
                screenerPrompt.buildUserPrompt(contextSummary, plan)
            );

            const { confidence: newConfidence, improvementSuggestions, ...content } = result;
            setScreener(content);
            setConfidence(newConfidence);
            setSuggestions(improvementSuggestions);
        } catch (err) {
            console.error('Generation error:', err);
            setError(err instanceof Error ? err.message : 'Failed to generate screener');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = () => {
        if (screener) {
            addResearchObject('screener', screener, confidence, suggestions);
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

                <Card>
                    <CardContent className="pt-6">
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
                                Generate Screener
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
                    <h2 className="text-lg font-semibold">Screener Questions</h2>
                    <p className="text-sm text-muted-foreground">
                        {screener.questions.length} questions generated
                    </p>
                </div>
                <ConfidenceIndicator level={confidence} />
            </div>

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

            {/* Improvement Suggestions */}
            {suggestions.length > 0 && (
                <Card className="bg-amber-50 border-amber-200">
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm flex items-center gap-2 text-amber-800">
                            <Lightbulb className="h-4 w-4" />
                            To improve this screener
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <ul className="space-y-1">
                            {suggestions.map((s, i) => (
                                <li key={i} className="text-sm text-amber-700">• {s}</li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

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

            <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleSave}>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                </Button>
                <Button className="flex-1" onClick={() => { handleSave(); setCurrentStep(4); }}>
                    Evaluate Responses
                    <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
            </div>
        </div>
    );
}
