import { useCallback, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, X, Loader2, Image, CheckCircle } from 'lucide-react';

interface FileUploadProps {
    onFileProcessed: (content: string, fileName: string) => void;
    acceptTypes?: string;
    maxSizeMB?: number;
    maxFiles?: number;
    multiple?: boolean;
    title?: string;
    description?: string;
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

interface ProcessingState {
    currentFile: string;
    currentIndex: number;
    totalFiles: number;
    progress: number;
    status: string;
}

export function FileUpload({
    onFileProcessed,
    maxSizeMB = 10,
    maxFiles = 25,
    multiple = false,
    title = 'File Upload',
    description = 'Upload documents or images for context (TXT, CSV, XLSX, DOCX, PNG, JPG)',
}: FileUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processing, setProcessing] = useState<ProcessingState | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [completedFiles, setCompletedFiles] = useState<string[]>([]);

    const processFile = useCallback(async (file: File): Promise<boolean> => {
        console.log('FileUpload: processFile started for:', file.name, 'type:', file.type, 'size:', file.size);

        // Check file size
        if (file.size > maxSizeMB * 1024 * 1024) {
            setError(`${file.name} exceeds ${maxSizeMB}MB limit`);
            return false;
        }

        // Check file type
        if (!SUPPORTED_TYPES.includes(file.type) && !file.name.match(/\.(csv|xlsx?|pdf|docx?|txt|png|jpe?g)$/i)) {
            setError(`${file.name}: Unsupported file type`);
            return false;
        }

        try {
            let content = '';

            // Plain text files
            if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
                setProcessing(prev => prev ? { ...prev, status: 'Reading text file...' } : null);
                content = await file.text();
                console.log('FileUpload: Read text file content, length:', content.length);
            }
            // CSV files
            else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
                setProcessing(prev => prev ? { ...prev, status: 'Parsing CSV...' } : null);
                content = await file.text();
            }
            // Excel files
            else if (file.name.match(/\.xlsx?$/i)) {
                setProcessing(prev => prev ? { ...prev, status: 'Parsing Excel file...' } : null);
                const XLSX = await import('xlsx');
                const buffer = await file.arrayBuffer();
                const workbook = XLSX.read(buffer, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                content = XLSX.utils.sheet_to_csv(firstSheet);
            }
            // Word documents
            else if (file.name.match(/\.docx?$/i)) {
                setProcessing(prev => prev ? { ...prev, status: 'Extracting text...' } : null);
                const mammoth = await import('mammoth');
                const buffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer: buffer });
                content = result.value;
            }
            // PDF files
            else if (file.name.match(/\.pdf$/i)) {
                setError(`${file.name}: PDF support coming soon. Please use DOCX/TXT format.`);
                return false;
            }
            // Images - OCR with Tesseract.js
            else if (file.name.match(/\.(png|jpe?g)$/i)) {
                setProcessing(prev => prev ? { ...prev, status: 'Loading OCR engine...', progress: 10 } : null);

                const Tesseract = await import('tesseract.js');
                const imageUrl = URL.createObjectURL(file);

                try {
                    const result = await Tesseract.recognize(
                        imageUrl,
                        'eng',
                        {
                            logger: (m) => {
                                if (m.status === 'recognizing text') {
                                    const progress = Math.round(20 + (m.progress * 70));
                                    setProcessing(prev => prev ? {
                                        ...prev,
                                        status: `Recognizing text... ${Math.round(m.progress * 100)}%`,
                                        progress
                                    } : null);
                                } else if (m.status === 'loading tesseract core') {
                                    setProcessing(prev => prev ? { ...prev, status: 'Loading OCR core...', progress: 15 } : null);
                                } else if (m.status === 'loading language traineddata') {
                                    setProcessing(prev => prev ? { ...prev, status: 'Loading language data...', progress: 25 } : null);
                                }
                            }
                        }
                    );
                    content = result.data.text;
                } finally {
                    URL.revokeObjectURL(imageUrl);
                }
            }

            if (content.trim()) {
                console.log('FileUpload: Calling onFileProcessed callback for:', file.name, 'content length:', content.length);
                onFileProcessed(content, file.name);
                console.log('FileUpload: onFileProcessed callback completed');
                return true;
            } else {
                setError(`${file.name}: No text content could be extracted`);
                return false;
            }
        } catch (err) {
            console.error('File processing error:', err);
            setError(`${file.name}: Failed to process file`);
            return false;
        }
    }, [maxSizeMB, onFileProcessed]);

    const processFiles = useCallback(async (files: File[]) => {
        setError(null);
        setCompletedFiles([]);

        // Limit to maxFiles
        const filesToProcess = files.slice(0, maxFiles);

        if (files.length > maxFiles) {
            setError(`Only first ${maxFiles} files will be processed`);
        }

        setIsProcessing(true);
        const completed: string[] = [];

        for (let i = 0; i < filesToProcess.length; i++) {
            const file = filesToProcess[i];

            setProcessing({
                currentFile: file.name,
                currentIndex: i + 1,
                totalFiles: filesToProcess.length,
                progress: 0,
                status: 'Starting...',
            });

            const success = await processFile(file);
            if (success) {
                completed.push(file.name);
                setCompletedFiles([...completed]);
            }
        }

        setIsProcessing(false);
        setProcessing(null);

        // Show success message briefly
        if (completed.length > 0) {
            setTimeout(() => setCompletedFiles([]), 3000);
        }
    }, [maxFiles, processFile]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            if (multiple) {
                processFiles(files);
            } else {
                processFiles([files[0]]);
            }
        }
    }, [multiple, processFiles]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            processFiles(Array.from(files));
        }
        e.target.value = ''; // Reset input
    }, [processFiles]);

    const isOCRProcessing = processing?.currentFile?.match(/\.(png|jpe?g)$/i);

    return (
        <Card>
            <CardHeader className="py-3">
                <CardTitle className="text-sm">{title}</CardTitle>
                <CardDescription className="text-xs">
                    {description}
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
                        multiple={multiple}
                        onChange={handleFileSelect}
                    />

                    {isProcessing && processing ? (
                        <div className="flex flex-col items-center gap-3">
                            {isOCRProcessing ? (
                                <Image className="h-8 w-8 animate-pulse text-primary" />
                            ) : (
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            )}
                            <div className="w-full max-w-xs space-y-2">
                                <p className="text-sm font-medium">
                                    {processing.totalFiles > 1
                                        ? `Processing ${processing.currentIndex} of ${processing.totalFiles}`
                                        : processing.currentFile
                                    }
                                </p>
                                <p className="text-xs text-muted-foreground truncate">{processing.currentFile}</p>
                                <p className="text-xs text-muted-foreground">{processing.status}</p>
                                {(isOCRProcessing || processing.totalFiles > 1) && (
                                    <Progress
                                        value={processing.totalFiles > 1
                                            ? ((processing.currentIndex - 1) / processing.totalFiles) * 100 + (processing.progress / processing.totalFiles)
                                            : processing.progress
                                        }
                                        className="h-2"
                                    />
                                )}
                            </div>
                        </div>
                    ) : completedFiles.length > 0 ? (
                        <div className="flex flex-col items-center gap-2">
                            <CheckCircle className="h-8 w-8 text-green-500" />
                            <p className="text-sm font-medium text-green-600">
                                {completedFiles.length} file{completedFiles.length > 1 ? 's' : ''} uploaded successfully
                            </p>
                        </div>
                    ) : (
                        <>
                            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm font-medium">
                                {multiple ? 'Drop files here or click to browse' : 'Drop file here or click to browse'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Max {maxSizeMB}MB per file • TXT, CSV, XLSX, DOCX, PNG, JPG
                                {multiple && ` • Up to ${maxFiles} files`}
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
