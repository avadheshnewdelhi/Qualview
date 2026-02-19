import { useCallback, useState, useEffect } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ConfidenceIndicator } from '@/components/shared/ConfidenceIndicator';
import { FileUpload } from '@/components/context/FileUpload';
import {
    Sparkles,
    ArrowRight,
    Layers,
    Lightbulb,
    Users,
    AlertCircle,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Loader2
} from 'lucide-react';
import { generateCompletion } from '@/lib/openai';
import { evaluatePrompt } from '@/lib/prompts';
import { parseResponseWithAI } from '@/lib/prompts/parseResponse';
import type { ParticipantsContent, ScreenerContent, ConfidenceLevel, Participant } from '@/types';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

interface PendingFile {
    content: string;
    fileName: string;
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
        setSettingsOpen,
        uploadedResponses,
        addUploadedResponse,
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

    // Queue for files pending AI parsing
    const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
    const [isParsing, setIsParsing] = useState(false);
    const [parseProgress, setParseProgress] = useState({ current: 0, total: 0 });

    // Process pending files with AI
    useEffect(() => {
        if (pendingFiles.length === 0 || isParsing || !settings?.apiKey) return;

        const processQueue = async () => {
            setIsParsing(true);

            // Capture snapshot of files to process
            const filesToProcess = [...pendingFiles];
            const processedFileNames = new Set<string>();

            setParseProgress({ current: 0, total: filesToProcess.length });

            for (let i = 0; i < filesToProcess.length; i++) {
                const file = filesToProcess[i];
                setParseProgress({ current: i + 1, total: filesToProcess.length });

                console.log(`AI parsing file ${i + 1}/${filesToProcess.length}: ${file.fileName}`);

                const result = await parseResponseWithAI(file.content, file.fileName, settings);

                if (result) {
                    addUploadedResponse(result);
                    processedFileNames.add(file.fileName);
                } else {
                    console.warn('Failed to parse:', file.fileName);
                    processedFileNames.add(file.fileName); // Still remove failed ones
                }
            }

            // Only remove the files we just processed, keep any newly added files
            setPendingFiles(prev => prev.filter(f => !processedFileNames.has(f.fileName)));
            setIsParsing(false);
        };

        processQueue();
    }, [pendingFiles, isParsing, settings, addUploadedResponse]);

    const handleFileProcessed = useCallback((content: string, fileName: string) => {
        console.log('=== EvaluationStep: handleFileProcessed called ===');
        console.log('File:', fileName, 'Content length:', content.length);

        // Skip files with no content
        if (content.trim().length < 10) {
            console.warn('File content too short:', fileName);
            return;
        }

        // Add to pending files queue for AI parsing
        setPendingFiles(prev => [...prev, { content, fileName }]);
        console.log('File queued for AI parsing:', fileName);
    }, []);

    const handleEvaluate = async () => {
        if (!settings?.apiKey) {
            setSettingsOpen(true);
            return;
        }

        if (!screener || uploadedResponses.length === 0) {
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
                evaluatePrompt.buildUserPrompt(screener, uploadedResponses)
            );

            const { confidence: newConfidence, improvementSuggestions, ...content } = result;
            setParticipants(content);
            setConfidence(newConfidence);
            setSuggestions(improvementSuggestions);
            addResearchObject('participants', content, newConfidence, improvementSuggestions);
        } catch (err) {
            console.error('Evaluation error:', err);
            setError(err instanceof Error ? err.message : 'Failed to evaluate responses');
        } finally {
            setLoading(false);
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

                {!settings?.apiKey && (
                    <div className="p-3 bg-amber-50 text-amber-800 rounded-md text-sm flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span>Add your OpenAI API key in settings to enable AI-powered response parsing</span>
                    </div>
                )}

                {isParsing && (
                    <Card>
                        <CardContent className="py-4">
                            <div className="flex items-center gap-3">
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                <div>
                                    <p className="text-sm font-medium">
                                        Parsing responses with AI... ({parseProgress.current}/{parseProgress.total})
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Extracting participant data from uploaded files
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <FileUpload
                    onFileProcessed={handleFileProcessed}
                    multiple={true}
                    maxFiles={25}
                    title="Upload Screener Responses"
                    description="Upload TXT/CSV files with participant responses (up to 25 files)"
                />

                {uploadedResponses.length > 0 && (
                    <Card>
                        <CardHeader className="py-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                {uploadedResponses.length} Response(s) Loaded
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="text-xs text-muted-foreground mb-3">
                                Participants: {uploadedResponses.map(r => r.participantId).join(', ')}
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

            <Button className="w-full" onClick={() => setCurrentStep(5)}>
                Create Interview Guide
                <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
        </div>
    );
}
