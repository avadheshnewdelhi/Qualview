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
    Save,
    ArrowRight,
    Layers,
    Lightbulb,
    Users,
    AlertCircle,
    CheckCircle,
    XCircle,
    AlertTriangle
} from 'lucide-react';
import { generateCompletion } from '@/lib/openai';
import { evaluatePrompt } from '@/lib/prompts';
import type { ParticipantsContent, ScreenerContent, ConfidenceLevel, Participant } from '@/types';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

interface ParsedResponse {
    participantId: string;
    answers: Record<string, string>;
}

export function EvaluationStep() {
    const {
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
    const existingParticipants = getResearchObject('participants');
    const screenerObj = getResearchObject('screener');
    const screener = screenerObj?.content as ScreenerContent | undefined;

    const [participants, setParticipants] = useState<ParticipantsContent | null>(
        existingParticipants?.content as ParticipantsContent || null
    );
    const [confidence, setConfidence] = useState<ConfidenceLevel>(
        existingParticipants?.confidence || 'medium'
    );
    const [suggestions, setSuggestions] = useState<string[]>(
        existingParticipants?.improvementSuggestions || []
    );
    const [responses, setResponses] = useState<ParsedResponse[]>([]);

    const handleFileProcessed = useCallback((content: string, _fileName: string) => {
        // Parse CSV-like response data
        const lines = content.split('\n').filter(l => l.trim());
        if (lines.length < 2) return;

        const headers = lines[0].split(',').map(h => h.trim());
        const parsed: ParsedResponse[] = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const answers: Record<string, string> = {};

            headers.forEach((header, idx) => {
                if (header.toLowerCase() !== 'participantid' && header.toLowerCase() !== 'id') {
                    answers[header] = values[idx] || '';
                }
            });

            parsed.push({
                participantId: values[0] || `P${i}`,
                answers,
            });
        }

        setResponses(prev => [...prev, ...parsed].slice(0, 50)); // Max 50 responses
    }, []);

    const handleEvaluate = async () => {
        if (!settings?.apiKey) {
            setSettingsOpen(true);
            return;
        }

        if (!screener || responses.length === 0) {
            setError('Please upload screener responses first');
            return;
        }

        if (!isOnline) {
            setError('You are offline. Please reconnect to use AI features.');
            return;
        }

        setLoading(true, 'Evaluating participant responses...');
        setError(null);

        try {
            const result = await generateCompletion<ParticipantsContent & { confidence: ConfidenceLevel; improvementSuggestions: string[] }>(
                settings,
                evaluatePrompt.system,
                evaluatePrompt.buildUserPrompt(screener, responses)
            );

            const { confidence: newConfidence, improvementSuggestions, ...content } = result;
            setParticipants(content);
            setConfidence(newConfidence);
            setSuggestions(improvementSuggestions);
        } catch (err) {
            console.error('Evaluation error:', err);
            setError(err instanceof Error ? err.message : 'Failed to evaluate responses');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = () => {
        if (participants) {
            addResearchObject('participants', participants, confidence, suggestions);
        }
    };

    const handleInsertToCanvas = () => {
        const obj = getResearchObject('participants');
        if (obj) {
            insertToCanvas(obj.id);
        }
    };

    const renderParticipant = (p: Participant, qualified: boolean) => (
        <Card key={p.id} className={qualified ? 'border-green-200' : 'border-red-200'}>
            <CardHeader className="py-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {qualified ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="font-medium text-sm">{p.id}</span>
                    </div>
                    <Badge variant={qualified ? 'success' : 'destructive'}>
                        Score: {p.score}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
                <p className="text-xs text-muted-foreground">{p.reasoning}</p>
                {p.flags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {p.flags.map((flag, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                                <AlertTriangle className="h-2 w-2 mr-1" />
                                {flag.replace(/_/g, ' ')}
                            </Badge>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );

    if (!participants) {
        return (
            <div className="space-y-4">
                <div>
                    <h2 className="text-lg font-semibold">Evaluate Responses</h2>
                    <p className="text-sm text-muted-foreground">
                        Upload screener responses to identify qualified participants.
                    </p>
                </div>

                <FileUpload onFileProcessed={handleFileProcessed} />

                {responses.length > 0 && (
                    <Card>
                        <CardHeader className="py-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                {responses.length} Response(s) Loaded
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="text-xs text-muted-foreground mb-3">
                                Participants: {responses.map(r => r.participantId).join(', ')}
                            </div>

                            {!settings?.apiKey && (
                                <div className="p-3 bg-amber-50 text-amber-800 rounded-md text-sm flex items-center gap-2 mb-3">
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                    <span>Add your OpenAI API key in settings first</span>
                                </div>
                            )}

                            <Button
                                onClick={handleEvaluate}
                                className="w-full"
                                disabled={!settings?.apiKey || !isOnline || !screener}
                            >
                                <Sparkles className="h-4 w-4 mr-2" />
                                Evaluate Responses
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {!screener && (
                    <div className="p-3 bg-amber-50 text-amber-800 rounded-md text-sm flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span>Complete screener questions first to enable evaluation</span>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">Participant Evaluation</h2>
                    <p className="text-sm text-muted-foreground">
                        {participants.qualified.length} qualified, {participants.disqualified.length} disqualified
                    </p>
                </div>
                <ConfidenceIndicator level={confidence} />
            </div>

            {/* Qualified */}
            {participants.qualified.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-green-700 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Qualified ({participants.qualified.length})
                    </h3>
                    {participants.qualified.map(p => renderParticipant(p, true))}
                </div>
            )}

            {/* Disqualified */}
            {participants.disqualified.length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-red-700 flex items-center gap-2">
                        <XCircle className="h-4 w-4" />
                        Disqualified ({participants.disqualified.length})
                    </h3>
                    {participants.disqualified.map(p => renderParticipant(p, false))}
                </div>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && (
                <Card className="bg-amber-50 border-amber-200">
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm flex items-center gap-2 text-amber-800">
                            <Lightbulb className="h-4 w-4" />
                            Recommendations
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
                <Button className="flex-1" onClick={() => { handleSave(); setCurrentStep(5); }}>
                    Create Interview Guide
                    <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
            </div>
        </div>
    );
}
