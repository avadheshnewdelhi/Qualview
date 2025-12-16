import { useState, useCallback } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ConfidenceIndicator } from '@/components/shared/ConfidenceIndicator';
import { FileUpload } from '@/components/context/FileUpload';
import {
    Sparkles,
    RefreshCw,
    Save,
    Layers,
    Lightbulb,
    FileText,
    AlertCircle,
    X,
    Zap,
    HelpCircle
} from 'lucide-react';
import { generateCompletion, buildContextSummary } from '@/lib/openai';
import { synthesisPrompt } from '@/lib/prompts';
import type { InsightsContent, PlanContent, ConfidenceLevel } from '@/types';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

const STRENGTH_COLORS = {
    weak: 'bg-orange-100 text-orange-800',
    moderate: 'bg-blue-100 text-blue-800',
    strong: 'bg-green-100 text-green-800',
};

export function SynthesisStep() {
    const {
        context,
        settings,
        setLoading,
        setError,
        addResearchObject,
        getResearchObject,
        insertToCanvas,
        setSettingsOpen,
        transcripts,
        addTranscripts,
        removeTranscript
    } = useStore();

    const isOnline = useOnlineStatus();
    const existingInsights = getResearchObject('insights');
    const planObj = getResearchObject('plan');
    const plan = planObj?.content as PlanContent | undefined;

    const [insights, setInsights] = useState<InsightsContent | null>(
        existingInsights?.content as InsightsContent || null
    );
    const [confidence, setConfidence] = useState<ConfidenceLevel>(
        existingInsights?.confidence || 'medium'
    );
    const [suggestions, setSuggestions] = useState<string[]>(
        existingInsights?.improvementSuggestions || []
    );

    const handleFileProcessed = useCallback((content: string, fileName: string) => {
        if (transcripts.length >= 25) {
            setError('Maximum 25 transcripts reached');
            return;
        }
        addTranscripts([{ name: fileName, content }]);
    }, [transcripts.length, addTranscripts, setError]);

    const handleSynthesize = async () => {
        if (!settings?.apiKey) {
            setSettingsOpen(true);
            return;
        }

        if (!plan) {
            setError('Please complete research plan first');
            return;
        }

        if (transcripts.length === 0) {
            setError('Please upload at least one transcript');
            return;
        }

        if (!isOnline) {
            setError('You are offline. Please reconnect to use AI features.');
            return;
        }

        setLoading(true, 'Synthesizing insights from transcripts...');
        setError(null);

        try {
            const contextSummary = buildContextSummary(context);
            const result = await generateCompletion<InsightsContent & { confidence: ConfidenceLevel; improvementSuggestions: string[] }>(
                settings,
                synthesisPrompt.system,
                synthesisPrompt.buildUserPrompt(contextSummary, plan, transcripts)
            );

            const { confidence: newConfidence, improvementSuggestions, ...content } = result;
            setInsights(content);
            setConfidence(newConfidence);
            setSuggestions(improvementSuggestions);
        } catch (err) {
            console.error('Synthesis error:', err);
            setError(err instanceof Error ? err.message : 'Failed to synthesize insights');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = () => {
        if (insights) {
            addResearchObject('insights', insights, confidence, suggestions);
        }
    };

    const handleInsertToCanvas = () => {
        const obj = getResearchObject('insights');
        if (obj) {
            insertToCanvas(obj.id);
        }
    };

    // Upload and manage transcripts view
    const renderTranscriptUpload = () => (
        <div className="space-y-4">
            <div>
                <h2 className="text-lg font-semibold">Synthesis</h2>
                <p className="text-sm text-muted-foreground">
                    Upload interview transcripts to synthesize insights.
                </p>
            </div>

            <FileUpload onFileProcessed={handleFileProcessed} />

            {transcripts.length > 0 && (
                <Card>
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Transcripts ({transcripts.length}/25)
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-2">
                        {transcripts.map((t) => (
                            <div key={t.id} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                                <span className="truncate flex-1">{t.name}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 flex-shrink-0"
                                    onClick={() => removeTranscript(t.id)}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}

                        {!settings?.apiKey && (
                            <div className="p-3 bg-amber-50 text-amber-800 rounded-md text-sm flex items-center gap-2 mt-3">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                <span>Add your OpenAI API key in settings first</span>
                            </div>
                        )}

                        <Button
                            onClick={handleSynthesize}
                            className="w-full mt-3"
                            disabled={!settings?.apiKey || !isOnline || !plan}
                        >
                            <Sparkles className="h-4 w-4 mr-2" />
                            Synthesize Insights
                        </Button>
                    </CardContent>
                </Card>
            )}

            {!plan && (
                <div className="p-3 bg-amber-50 text-amber-800 rounded-md text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>Complete research plan first</span>
                </div>
            )}
        </div>
    );

    if (!insights) {
        return renderTranscriptUpload();
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">Research Insights</h2>
                    <p className="text-sm text-muted-foreground">
                        {insights.themes.length} themes, {insights.insights.length} insights
                    </p>
                </div>
                <ConfidenceIndicator level={confidence} />
            </div>

            {/* Themes */}
            <div className="space-y-2">
                <h3 className="text-sm font-medium flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    Themes
                </h3>
                <div className="grid gap-2">
                    {insights.themes.map((theme) => (
                        <Card key={theme.id} className="bg-primary/5">
                            <CardContent className="py-3">
                                <h4 className="font-medium text-sm">{theme.name}</h4>
                                <p className="text-xs text-muted-foreground mt-1">{theme.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Insights */}
            <div className="space-y-2">
                <h3 className="text-sm font-medium flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-500" />
                    Key Insights
                </h3>
                {insights.insights.map((insight) => (
                    <Card key={insight.id}>
                        <CardContent className="py-3 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-medium flex-1">{insight.statement}</p>
                                <Badge className={STRENGTH_COLORS[insight.strength]}>
                                    {insight.strength}
                                </Badge>
                            </div>
                            {insight.evidence.length > 0 && (
                                <div className="text-xs text-muted-foreground border-l-2 border-muted pl-3 space-y-1">
                                    {insight.evidence.slice(0, 2).map((e, i) => (
                                        <p key={i} className="italic">"{e}"</p>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Opportunities */}
            {insights.opportunities.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-sm font-medium">Opportunities</h3>
                    <Card>
                        <CardContent className="py-3">
                            <ul className="space-y-1">
                                {insights.opportunities.map((opp, i) => (
                                    <li key={i} className="text-sm flex items-start gap-2">
                                        <span className="text-green-500">→</span>
                                        {opp}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* HMW Prompts */}
            {insights.hmwPrompts.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                        <HelpCircle className="h-4 w-4 text-purple-500" />
                        How Might We...
                    </h3>
                    <Card className="bg-purple-50 border-purple-200">
                        <CardContent className="py-3">
                            <ul className="space-y-1">
                                {insights.hmwPrompts.map((hmw, i) => (
                                    <li key={i} className="text-sm text-purple-800">• {hmw}</li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && (
                <Card className="bg-amber-50 border-amber-200">
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm flex items-center gap-2 text-amber-800">
                            <Lightbulb className="h-4 w-4" />
                            To strengthen these insights
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
                <Button variant="outline" size="sm" onClick={handleSynthesize}>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Re-synthesize
                </Button>
                <Button variant="outline" size="sm" onClick={handleInsertToCanvas}>
                    <Layers className="h-3 w-3 mr-1" />
                    Insert to Canvas
                </Button>
            </div>

            <Separator />

            <Button className="w-full" onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Insights
            </Button>
        </div>
    );
}
