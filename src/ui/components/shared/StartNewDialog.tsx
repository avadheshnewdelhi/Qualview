import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Layers, X } from 'lucide-react';
import { useStore } from '@/store';

interface StartNewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function StartNewDialog({ open, onOpenChange }: StartNewDialogProps) {
    const { researchObjects, insertAllToCanvas, resetProject } = useStore();
    const [isInserting, setIsInserting] = useState(false);

    const hasObjects = researchObjects.length > 0;
    const objectCount = researchObjects.length;

    const handleInsertAndStart = async () => {
        setIsInserting(true);

        // Insert all objects to canvas
        insertAllToCanvas();

        // Wait for insertions to complete (300ms per object + buffer)
        const waitTime = objectCount * 300 + 500;

        setTimeout(() => {
            resetProject();
            setIsInserting(false);
            onOpenChange(false);
        }, waitTime);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        Start New Research?
                    </DialogTitle>
                    <DialogDescription className="pt-2">
                        {hasObjects ? (
                            <>
                                You have <strong>{objectCount} research artifact{objectCount > 1 ? 's' : ''}</strong> in progress.
                                Starting new research will clear all current data and progress.
                            </>
                        ) : (
                            <>
                                Starting new research will clear any context and transcripts you've added.
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>

                {hasObjects && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                        <p className="font-medium mb-1">Your artifacts:</p>
                        <ul className="space-y-0.5">
                            {researchObjects.map((obj) => (
                                <li key={obj.id} className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                    {obj.type.charAt(0).toUpperCase() + obj.type.slice(1).replace('-', ' ')}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button
                        variant="destructive"
                        onClick={() => { resetProject(); onOpenChange(false); }}
                        className="w-full sm:w-auto"
                    >
                        <X className="h-4 w-4 mr-2" />
                        Reset
                    </Button>

                    {hasObjects && (
                        <Button
                            onClick={handleInsertAndStart}
                            disabled={isInserting}
                            className="w-full sm:w-auto bg-primary"
                        >
                            <Layers className="h-4 w-4 mr-2" />
                            {isInserting
                                ? `Inserting ${objectCount} artifact${objectCount > 1 ? 's' : ''}...`
                                : `Insert All & Start New`
                            }
                        </Button>
                    )}

                    {!hasObjects && (
                        <Button
                            onClick={() => { resetProject(); onOpenChange(false); }}
                            className="w-full sm:w-auto"
                        >
                            Start New Research
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
