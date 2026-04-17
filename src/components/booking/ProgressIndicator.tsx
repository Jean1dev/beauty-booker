interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps?: number;
}

const stepLabels = ["Serviço", "Data & Hora", "Confirmação"];

export const ProgressIndicator = ({ currentStep, totalSteps = 3 }: ProgressIndicatorProps) => {
  return (
    <div className="flex items-center justify-center gap-0">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <div key={step} className="flex items-center">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 ${
                currentStep > step
                  ? "bg-primary text-primary-foreground"
                  : currentStep === step
                  ? "bg-primary text-primary-foreground shadow-accent scale-110"
                  : "bg-secondary text-muted-foreground border border-border"
              }`}
            >
              {currentStep > step ? (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                step
              )}
            </div>
            <span
              className={`text-[10px] font-medium tracking-wide hidden sm:block transition-colors ${
                currentStep >= step ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {stepLabels[step - 1]}
            </span>
          </div>
          {step < totalSteps && (
            <div
              className={`w-16 md:w-24 h-px mx-1 mb-4 transition-colors duration-300 ${
                currentStep > step ? "bg-primary" : "bg-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
};
