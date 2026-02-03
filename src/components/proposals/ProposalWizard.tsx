
import { useProposal } from "@/contexts/ProposalContext";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Save } from "lucide-react";
import { StepSetup } from "./steps/StepSetup";
import { StepParties } from "./steps/StepParties";
import { StepCompanyInfo } from "./steps/StepCompanyInfo";
import { StepScope } from "./steps/StepScope";
import { StepPricing } from "./steps/StepPricing";
import { StepTimeline } from "./steps/StepTimeline";
import { StepSignOff } from "./steps/StepSignOff";

// Step Component Map
const STEP_COMPONENTS: Record<number, React.ReactNode> = {
    1: <StepSetup />,
    2: <StepParties />,
    3: <StepCompanyInfo />,
    4: <StepScope />,
    5: <StepPricing />,
    6: <StepTimeline />,
    7: <StepSignOff />,
};

const TOTAL_STEPS = 7;

export function ProposalWizard() {
    const { currentStep, setCurrentStep } = useProposal();

    const handleNext = () => {
        if (currentStep < TOTAL_STEPS) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto pr-2 pb-20">
                {/* Step Indicator */}
                <div className="mb-6 flex items-center justify-between text-sm text-muted-foreground">
                    <span>Step {currentStep} of {TOTAL_STEPS}</span>
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-medium">Auto-saving...</span>
                </div>

                {STEP_COMPONENTS[currentStep]}
            </div>

            {/* Navigation Footer - Fixed at bottom of left panel */}
            <div className="bg-background pt-4 border-t flex justify-between mt-auto">
                <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={currentStep === 1}
                >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <div className="flex gap-2">
                    <Button variant="ghost">
                        <Save className="mr-2 h-4 w-4" />
                        Save Draft
                    </Button>
                    <Button onClick={handleNext}>
                        {currentStep === TOTAL_STEPS ? 'Finish' : 'Next'}
                        <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
