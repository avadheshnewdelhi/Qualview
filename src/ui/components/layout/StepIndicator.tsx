import { cn } from '@/lib/utils';
import { useStore, STEPS } from '@/store';
import { Check, Circle } from 'lucide-react';

export function StepIndicator() {
    const { ui, context, researchObjects, setCurrentStep } = useStore();
    const { currentStep } = ui;

    const isStepCompleted = (stepId: number) => {
        switch (stepId) {
            case 0:
                return context.sources.length > 0;
            case 1:
                return researchObjects.some((o) => o.type === 'framing');
            case 2:
                return researchObjects.some((o) => o.type === 'plan');
            case 3:
                return researchObjects.some((o) => o.type === 'screener');
            case 4:
                return researchObjects.some((o) => o.type === 'participants');
            case 5:
                return researchObjects.some((o) => o.type === 'interview-guide');
            case 6:
                return researchObjects.some((o) => o.type === 'insights');
            default:
                return false;
        }
    };

    return (
        <div className="flex items-center gap-1 px-4 py-2 border-b bg-muted/30 overflow-x-auto">
            {STEPS.map((step) => {
                const isCompleted = isStepCompleted(step.id);
                const isCurrent = currentStep === step.id;

                return (
                    <button
                        key={step.id}
                        onClick={() => setCurrentStep(step.id)}
                        className={cn(
                            'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
                            isCurrent && 'bg-primary text-primary-foreground',
                            !isCurrent && 'hover:bg-muted',
                            isCompleted && !isCurrent && 'text-green-600'
                        )}
                    >
                        {isCompleted ? (
                            <Check className="h-3 w-3" />
                        ) : (
                            <Circle className="h-3 w-3" />
                        )}
                        {step.name}
                    </button>
                );
            })}
        </div>
    );
}
