import { useState, useCallback } from 'react';
import { useStore } from '@/store';
import { useSelection } from '@/hooks/useSelection';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    MousePointer2,
    FileText,
    Upload,
    X,
    CheckCircle,
    ArrowRight
} from 'lucide-react';
import { FileUpload } from '@/components/context/FileUpload';

export function ContextStep() {
    const { context, addContextSource, removeContextSource, setCurrentStep } = useStore();
    const { selection, hasSelection, extractedText } = useSelection();
    const [manualInput, setManualInput] = useState('');
    const [activeTab, setActiveTab] = useState('canvas');

    const handleAddCanvasContext = () => {
        if (extractedText) {
            addContextSource({
                type: 'canvas',
                content: extractedText,
                metadata: {
                    nodeIds: selection.nodes.map((n) => n.id),
                    timestamp: Date.now(),
                },
            });
        }
    };

    const handleAddManualContext = () => {
        if (manualInput.trim()) {
            addContextSource({
                type: 'manual',
                content: manualInput.trim(),
                metadata: {
                    timestamp: Date.now(),
                },
            });
            setManualInput('');
        }
    };

    const handleFileProcessed = useCallback((content: string, fileName: string) => {
        addContextSource({
            type: 'file',
            content,
            metadata: {
                fileName,
                timestamp: Date.now(),
            },
        });
    }, [addContextSource]);

    const hasContext = context.sources.length > 0;

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-lg font-semibold">Gather Context</h2>
                <p className="text-sm text-muted-foreground">
                    Add context from your canvas, type it manually, or upload files.
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full">
                    <TabsTrigger value="canvas" className="flex-1 gap-1">
                        <MousePointer2 className="h-3 w-3" />
                        Canvas
                    </TabsTrigger>
                    <TabsTrigger value="manual" className="flex-1 gap-1">
                        <FileText className="h-3 w-3" />
                        Manual
                    </TabsTrigger>
                    <TabsTrigger value="upload" className="flex-1 gap-1">
                        <Upload className="h-3 w-3" />
                        Upload
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="canvas" className="mt-3">
                    <Card>
                        <CardHeader className="py-3">
                            <CardTitle className="text-sm">Canvas Selection</CardTitle>
                            <CardDescription className="text-xs">
                                Select frames, sections, or text on your canvas
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                            {hasSelection ? (
                                <div className="space-y-3">
                                    <div className="p-3 bg-muted rounded-md text-sm max-h-32 overflow-y-auto">
                                        <p className="text-xs text-muted-foreground mb-1">
                                            {selection.nodes.length} element(s) selected
                                        </p>
                                        {extractedText ? (
                                            <p className="whitespace-pre-wrap">{extractedText.slice(0, 500)}...</p>
                                        ) : (
                                            <p className="text-muted-foreground italic">No text content found</p>
                                        )}
                                    </div>
                                    <Button
                                        onClick={handleAddCanvasContext}
                                        disabled={!extractedText}
                                        size="sm"
                                        className="w-full"
                                    >
                                        Add to Context
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-center py-6 text-muted-foreground">
                                    <MousePointer2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Select elements on your canvas</p>
                                    <p className="text-xs">Text will be extracted automatically</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="manual" className="mt-3">
                    <Card>
                        <CardHeader className="py-3">
                            <CardTitle className="text-sm">Manual Input</CardTitle>
                            <CardDescription className="text-xs">
                                Describe your research problem, constraints, or hypotheses
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-3">
                            <Textarea
                                placeholder="Enter your research context, problem statement, or any relevant information..."
                                value={manualInput}
                                onChange={(e) => setManualInput(e.target.value)}
                                className="min-h-[100px] text-sm"
                            />
                            <Button
                                onClick={handleAddManualContext}
                                disabled={!manualInput.trim()}
                                size="sm"
                                className="w-full"
                            >
                                Add to Context
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="upload" className="mt-3">
                    <FileUpload onFileProcessed={handleFileProcessed} />
                </TabsContent>
            </Tabs>

            <Separator />

            {/* Context Summary */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Added Context</h3>
                    <Badge variant={hasContext ? 'success' : 'secondary'}>
                        {context.sources.length} source(s)
                    </Badge>
                </div>

                {context.sources.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        No context added yet. Add at least one source to continue.
                    </p>
                ) : (
                    <div className="space-y-2">
                        {context.sources.map((source) => (
                            <div
                                key={source.id}
                                className="flex items-start gap-2 p-2 bg-muted rounded-md"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="outline" className="text-xs">
                                            {source.type}
                                        </Badge>
                                        {source.metadata.fileName && (
                                            <span className="text-xs text-muted-foreground truncate">
                                                {source.metadata.fileName}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                        {source.content.slice(0, 150)}...
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 flex-shrink-0"
                                    onClick={() => removeContextSource(source.id)}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Continue Button */}
            {hasContext && (
                <Button
                    className="w-full"
                    onClick={() => setCurrentStep(1)}
                >
                    Continue to Research Framing
                    <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
            )}
        </div>
    );
}
