import { useState, useCallback } from 'react';
import { useStore } from '@/store';
import { useSelection } from '@/hooks/useSelection';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
    MousePointer2,
    FileText,
    Upload,
    X,
    ArrowRight,
    Image,
    Loader2
} from 'lucide-react';
import { FileUpload } from '@/components/context/FileUpload';
import { ContextGuidance } from '@/components/shared/ContextGuidance';
import { getOpenAIClient } from '@/lib/openai';
import type { SelectionNode } from '@/types';

export function ContextStep() {
    const { context, addContextSource, removeContextSource, setCurrentStep } = useStore();
    const { selection, hasSelection, extractedText } = useSelection();
    const [manualInput, setManualInput] = useState('');
    const [activeTab, setActiveTab] = useState('canvas');
    const [isProcessingOCR, setIsProcessingOCR] = useState(false);
    const [ocrProgress, setOcrProgress] = useState(0);
    const [ocrStatus, setOcrStatus] = useState('');

    // Check if selection has images
    const hasImages = selection.hasImages || false;

    // Collect all image data from nodes
    const collectImageData = (nodes: SelectionNode[]): string[] => {
        const images: string[] = [];
        for (const node of nodes) {
            if (node.imageData) {
                images.push(node.imageData);
            }
            if (node.children) {
                images.push(...collectImageData(node.children));
            }
        }
        return images;
    };

    // Process images with OCR using OpenAI Vision API
    // (Tesseract.js is blocked by Figma's Content Security Policy)
    const processImagesWithOCR = async (): Promise<string> => {
        const { settings } = useStore.getState();

        if (!settings?.apiKey) {
            setOcrStatus('Please configure OpenAI API key in settings');
            return '';
        }

        const images = collectImageData(selection.nodes);
        console.log('OCR: Found images:', images.length, 'from', selection.nodes.length, 'nodes');

        if (images.length === 0) {
            console.warn('OCR: No image data found in selection nodes');
            if (selection.hasImages) {
                setOcrStatus('Images detected but could not be exported. Please try re-selecting.');
            }
            return '';
        }

        setIsProcessingOCR(true);
        setOcrProgress(0);
        setOcrStatus('Extracting text with AI Vision...');

        try {
            const client = getOpenAIClient(settings);
            const ocrResults: string[] = [];

            for (let i = 0; i < images.length; i++) {
                setOcrStatus(`Processing image ${i + 1} of ${images.length}...`);
                setOcrProgress(Math.round((i / images.length) * 100));
                console.log(`OCR: Processing image ${i + 1}`);

                const response = await client.chat.completions.create({
                    model: 'gpt-5.2',
                    max_tokens: 2000,
                    messages: [
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'text',
                                    text: 'Extract and transcribe ALL text visible in this image. Include any handwritten notes, sticky notes, labels, titles, and any other text. Preserve the original structure and formatting. Only return the extracted text, no commentary.'
                                },
                                {
                                    type: 'image_url',
                                    image_url: {
                                        url: images[i],
                                        detail: 'high'
                                    }
                                }
                            ]
                        }
                    ]
                });

                const extractedText = response.choices[0]?.message?.content || '';
                console.log(`OCR: Image ${i + 1} result:`, extractedText.slice(0, 100));

                if (extractedText.trim()) {
                    ocrResults.push(`[Image ${i + 1}]\n${extractedText.trim()}`);
                }
            }

            setOcrProgress(100);
            setOcrStatus('Done!');
            const finalText = ocrResults.join('\n\n');
            console.log('OCR: Final extracted text length:', finalText.length);
            return finalText;
        } catch (error) {
            console.error('OCR error:', error);
            setOcrStatus('Failed to extract text from images');
            return '';
        } finally {
            setIsProcessingOCR(false);
        }
    };

    const handleAddCanvasContext = async () => {
        let contentToAdd = extractedText || '';
        console.log('handleAddCanvasContext: Starting with extractedText length:', contentToAdd.length);
        console.log('handleAddCanvasContext: hasImages =', hasImages);

        // If there are images, process them with OCR
        if (hasImages) {
            const ocrText = await processImagesWithOCR();
            console.log('handleAddCanvasContext: OCR returned text length:', ocrText.length);
            if (ocrText) {
                contentToAdd = contentToAdd
                    ? `${contentToAdd}\n\n--- Extracted from Images ---\n${ocrText}`
                    : ocrText;
            }
        }

        console.log('handleAddCanvasContext: Final content length:', contentToAdd.length);

        if (contentToAdd) {
            addContextSource({
                type: 'canvas',
                content: contentToAdd,
                metadata: {
                    nodeIds: selection.nodes.map((n) => n.id),
                    timestamp: Date.now(),
                    hasOCR: hasImages,
                },
            });
            console.log('handleAddCanvasContext: Context source added successfully');
        } else {
            console.warn('handleAddCanvasContext: No content to add!');
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
    const canAddCanvas = extractedText || hasImages;

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-lg font-semibold">Gather Context</h2>
                <p className="text-sm text-muted-foreground">
                    Add context from your canvas, type it manually, or upload files.
                </p>
            </div>

            <ContextGuidance />

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
                                Select frames, sections, text, or images on your canvas
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                            {hasSelection ? (
                                <div className="space-y-3">
                                    <div className="p-3 bg-muted rounded-md text-sm max-h-32 overflow-y-auto">
                                        <p className="text-xs text-muted-foreground mb-1">
                                            {selection.nodes.length} element(s) selected
                                            {hasImages && (
                                                <Badge variant="outline" className="ml-2 text-xs">
                                                    <Image className="h-2 w-2 mr-1" />
                                                    Images detected
                                                </Badge>
                                            )}
                                        </p>
                                        {extractedText ? (
                                            <p className="whitespace-pre-wrap">{extractedText.slice(0, 500)}...</p>
                                        ) : hasImages ? (
                                            <p className="text-muted-foreground italic">
                                                Images will be processed with OCR to extract text
                                            </p>
                                        ) : (
                                            <p className="text-muted-foreground italic">No text content found</p>
                                        )}
                                    </div>

                                    {isProcessingOCR && (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                                <span>{ocrStatus}</span>
                                            </div>
                                            <Progress value={ocrProgress} className="h-2" />
                                        </div>
                                    )}

                                    <Button
                                        onClick={handleAddCanvasContext}
                                        disabled={!canAddCanvas || isProcessingOCR}
                                        size="sm"
                                        className="w-full"
                                    >
                                        {isProcessingOCR ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Processing...
                                            </>
                                        ) : hasImages && !extractedText ? (
                                            <>
                                                <Image className="h-4 w-4 mr-2" />
                                                Extract Text from Images
                                            </>
                                        ) : (
                                            'Add to Context'
                                        )}
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-center py-6 text-muted-foreground">
                                    <MousePointer2 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Select elements on your canvas</p>
                                    <p className="text-xs">Text and images will be processed</p>
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
                                        {source.metadata.hasOCR && (
                                            <Badge variant="secondary" className="text-xs">
                                                <Image className="h-2 w-2 mr-1" />
                                                OCR
                                            </Badge>
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
