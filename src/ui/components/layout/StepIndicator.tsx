import { cn } from '@/lib/utils';
import { useStore, STEPS } from '@/store';
import { Check, Circle, Lock } from 'lucide-react';

export function StepIndicator() {
    const { ui, context, researchObjects, setCurrentStep } = useStore();
    const { currentStep } = ui;

    // Determine which steps are accessible
    const getStepStatus = (stepId: number) => {
        if (stepId === 0) return 'available'; // Context always available

        // Check prerequisites
        const hasContext = context.sources.length > 0;
        const hasFraming = researchObjects.some((o) => o.type === 'framing');
        const hasPlan = researchObjects.some((o) => o.type === 'plan');
        const hasScreener = researchObjects.some((o) => o.type === 'screener');

        switch (stepId) {
            case 1: // Framing
                return hasContext ? 'available' : 'locked';
            case 2: // Plan
                return hasFraming ? 'available' : 'locked';
            case 3: // Screener
                return hasPlan ? 'available' : 'locked';
            case 4: // Evaluate
                return hasScreener ? 'available' : 'locked';
            case 5: // Interview
                return hasPlan ? 'available' : 'locked';
            case 6: // Synthesis
                return hasPlan ? 'available' : 'locked';
            default:
                return 'locked';
        }
    };

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
            {STEPS.map((step, index) => {
                const status = getStepStatus(step.id);
                const isCompleted = isStepCompleted(step.id);
                const isCurrent = currentStep === step.id;
                const isLocked = status === 'locked';

                return (
                    <button
                        key={step.id}
                        onClick={() => !isLocked && setCurrentStep(step.id)}
                        disabled={isLocked}
                        className={cn(
                            'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
                            isCurrent && 'bg-primary text-primary-foreground',
                            !isCurrent && !isLocked && 'hover:bg-muted',
                            isLocked && 'opacity-50 cursor-not-allowed',
                            isCompleted && !isCurrent && 'text-green-600'
                        )}
                    >
                        {isCompleted ? (
                            <Check className="h-3 w-3" />
                        ) : isLocked ? (
                            <Lock className="h-3 w-3" />
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
