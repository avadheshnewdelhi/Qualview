import { Badge } from '@/components/ui/badge';
import type { ConfidenceLevel } from '@/types';

interface ConfidenceIndicatorProps {
    level: ConfidenceLevel;
}

export function ConfidenceIndicator({ level }: ConfidenceIndicatorProps) {
    const variants = {
        low: 'warning',
        medium: 'info',
        high: 'success',
    } as const;

    const labels = {
        low: 'Low Confidence',
        medium: 'Medium Confidence',
        high: 'High Confidence',
    };

    return (
        <Badge variant={variants[level]}>
            {labels[level]}
        </Badge>
    );
}
