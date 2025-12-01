import { ChevronRight } from "lucide-react";

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps?: number;
}

export const ProgressIndicator = ({ currentStep, totalSteps = 3 }: ProgressIndicatorProps) => {
  return (
    <div className="flex items-center justify-center gap-2 md:gap-4">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <div key={step} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold transition-all ${
              currentStep >= step
                ? "gradient-primary text-primary-foreground shadow-soft"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {step}
          </div>
          {step < totalSteps && (
            <ChevronRight className={currentStep > step ? "text-primary" : "text-muted-foreground"} />
          )}
        </div>
      ))}
    </div>
  );
};

