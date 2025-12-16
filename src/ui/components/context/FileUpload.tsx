import { useCallback, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, X, Loader2, Image } from 'lucide-react';

interface FileUploadProps {
    onFileProcessed: (content: string, fileName: string) => void;
    acceptTypes?: string;
    maxSizeMB?: number;
}

const SUPPORTED_TYPES = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/png',
    'image/jpeg',
];

export function FileUpload({
    onFileProcessed,
    maxSizeMB = 10
}: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingFile, setProcessingFile] = useState<string | null>(null);
    const [processingProgress, setProcessingProgress] = useState(0);
    const [processingStatus, setProcessingStatus] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const processFile = useCallback(async (file: File) => {
        setError(null);
        setProcessingProgress(0);
        setProcessingStatus('');

        // Check file size
        if (file.size > maxSizeMB * 1024 * 1024) {
            setError(`File exceeds ${maxSizeMB}MB limit`);
            return;
        }

        // Check file type
        if (!SUPPORTED_TYPES.includes(file.type) && !file.name.match(/\.(csv|xlsx?|pdf|docx?|txt|png|jpe?g)$/i)) {
            setError('Unsupported file type');
            return;
        }

        setIsProcessing(true);
        setProcessingFile(file.name);

        try {
            let content = '';

            // Plain text files
            if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
                setProcessingStatus('Reading text file...');
                content = await file.text();
            }
            // CSV files
            else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
                setProcessingStatus('Parsing CSV...');
                content = await file.text();
            }
            // Excel files
            else if (file.name.match(/\.xlsx?$/i)) {
                setProcessingStatus('Parsing Excel file...');
                const XLSX = await import('xlsx');
                const buffer = await file.arrayBuffer();
                const workbook = XLSX.read(buffer, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                content = XLSX.utils.sheet_to_csv(firstSheet);
            }
            // Word documents
            else if (file.name.match(/\.docx?$/i)) {
                setProcessingStatus('Extracting text from document...');
                const mammoth = await import('mammoth');
                const buffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer: buffer });
                content = result.value;
            }
            // PDF files
            else if (file.name.match(/\.pdf$/i)) {
                setProcessingStatus('PDF support coming soon...');
                setError('PDF support coming soon. Please copy text content manually or use DOCX/TXT format.');
                setIsProcessing(false);
                setProcessingFile(null);
                return;
            }
            // Images - OCR with Tesseract.js
            else if (file.name.match(/\.(png|jpe?g)$/i)) {
                setProcessingStatus('Loading OCR engine...');
                setProcessingProgress(10);

                // Dynamic import of tesseract.js
                const Tesseract = await import('tesseract.js');

                setProcessingStatus('Initializing text recognition...');
                setProcessingProgress(20);

                // Create a URL for the image file
                const imageUrl = URL.createObjectURL(file);

                try {
                    // Perform OCR with progress tracking
                    const result = await Tesseract.recognize(
                        imageUrl,
                        'eng', // English language
                        {
                            logger: (m) => {
                                if (m.status === 'recognizing text') {
                                    const progress = Math.round(20 + (m.progress * 70));
                                    setProcessingProgress(progress);
                                    setProcessingStatus(`Recognizing text... ${Math.round(m.progress * 100)}%`);
                                } else if (m.status === 'loading tesseract core') {
                                    setProcessingStatus('Loading OCR core...');
                                    setProcessingProgress(15);
                                } else if (m.status === 'initializing tesseract') {
                                    setProcessingStatus('Initializing OCR...');
                                    setProcessingProgress(18);
                                } else if (m.status === 'loading language traineddata') {
                                    setProcessingStatus('Loading language data...');
                                    setProcessingProgress(25);
                                } else if (m.status === 'initializing api') {
                                    setProcessingStatus('Starting recognition...');
                                    setProcessingProgress(30);
                                }
                            }
                        }
                    );

                    setProcessingProgress(95);
                    setProcessingStatus('Finalizing...');

                    content = result.data.text;

                    // Check confidence
                    if (result.data.confidence < 50) {
                        console.warn('Low OCR confidence:', result.data.confidence);
                    }
                } finally {
                    // Clean up the blob URL
                    URL.revokeObjectURL(imageUrl);
                }

                setProcessingProgress(100);
            }

            if (content.trim()) {
                onFileProcessed(content, file.name);
            } else {
                setError('No text content could be extracted from this file');
            }
        } catch (err) {
            console.error('File processing error:', err);
            setError('Failed to process file. Please try a different format.');
        } finally {
            setIsProcessing(false);
            setProcessingFile(null);
            setProcessingProgress(0);
            setProcessingStatus('');
        }
    }, [maxSizeMB, onFileProcessed]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            processFile(files[0]);
        }
    }, [processFile]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            processFile(files[0]);
        }
        e.target.value = ''; // Reset input
    }, [processFile]);

    const isOCRProcessing = processingFile?.match(/\.(png|jpe?g)$/i);

    return (
        <Card>
            <CardHeader className="py-3">
                <CardTitle className="text-sm">File Upload</CardTitle>
                <CardDescription className="text-xs">
                    Upload documents or images for context (TXT, CSV, XLSX, DOCX, PNG, JPG)
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
                <div
                    className={`
                        relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
                        ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
                        ${isProcessing ? 'pointer-events-none' : 'cursor-pointer hover:border-primary/50'}
                    `}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => !isProcessing && document.getElementById('file-input')?.click()}
                >
                    <input
                        id="file-input"
                        type="file"
                        className="hidden"
                        accept=".txt,.csv,.xlsx,.xls,.docx,.doc,.png,.jpg,.jpeg"
                        onChange={handleFileSelect}
                    />

                    {isProcessing ? (
                        <div className="flex flex-col items-center gap-3">
                            {isOCRProcessing ? (
                                <Image className="h-8 w-8 animate-pulse text-primary" />
                            ) : (
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            )}
                            <div className="w-full max-w-xs space-y-2">
                                <p className="text-sm font-medium">{processingFile}</p>
                                <p className="text-xs text-muted-foreground">{processingStatus}</p>
                                {isOCRProcessing && processingProgress > 0 && (
                                    <Progress value={processingProgress} className="h-2" />
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm font-medium">Drop file here or click to browse</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Max {maxSizeMB}MB • TXT, CSV, XLSX, DOCX, PNG, JPG
                            </p>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                                <Image className="h-3 w-3" />
                                Images are processed with OCR
                            </p>
                        </>
                    )}
                </div>

                {error && (
                    <div className="mt-2 p-2 bg-destructive/10 text-destructive text-xs rounded flex items-center gap-2">
                        <X className="h-3 w-3 flex-shrink-0" />
                        {error}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
