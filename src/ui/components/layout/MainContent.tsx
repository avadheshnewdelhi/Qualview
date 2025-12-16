import { useStore } from '@/store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ContextStep } from '@/components/steps/ContextStep';
import { ResearchFramingStep } from '@/components/steps/ResearchFramingStep';
import { ResearchPlanStep } from '@/components/steps/ResearchPlanStep';
import { ScreenerStep } from '@/components/steps/ScreenerStep';
import { EvaluationStep } from '@/components/steps/EvaluationStep';
import { InterviewGuideStep } from '@/components/steps/InterviewGuideStep';
import { SynthesisStep } from '@/components/steps/SynthesisStep';
import { LoadingOverlay } from '@/components/shared/LoadingOverlay';
import { ErrorAlert } from '@/components/shared/ErrorAlert';

export function MainContent() {
    const { ui } = useStore();
    const { currentStep, isLoading, loadingMessage, error } = ui;

    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return <ContextStep />;
            case 1:
                return <ResearchFramingStep />;
            case 2:
                return <ResearchPlanStep />;
            case 3:
                return <ScreenerStep />;
            case 4:
                return <EvaluationStep />;
            case 5:
                return <InterviewGuideStep />;
            case 6:
                return <SynthesisStep />;
            default:
                return <ContextStep />;
        }
    };

    return (
        <div className="flex-1 relative overflow-hidden">
            {error && <ErrorAlert message={error} />}

            <ScrollArea className="h-full">
                <div className="p-4 fade-in">
                    {renderStep()}
                </div>
            </ScrollArea>

            {isLoading && <LoadingOverlay message={loadingMessage} />}
        </div>
    );
}
