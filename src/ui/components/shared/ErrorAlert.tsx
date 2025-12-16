import { AlertCircle, X } from 'lucide-react';
import { useStore } from '@/store';

interface ErrorAlertProps {
    message: string;
}

export function ErrorAlert({ message }: ErrorAlertProps) {
    const { setError } = useStore();

    return (
        <div className="mx-4 mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <p className="text-sm text-destructive flex-1">{message}</p>
            <button
                onClick={() => setError(null)}
                className="text-destructive hover:text-destructive/80"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}
