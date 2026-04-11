"use client";

interface OnboardingProgressDotsProps {
  currentStep: number;
  totalSteps: number;
}

export function OnboardingProgressDots({ currentStep, totalSteps }: OnboardingProgressDotsProps) {
  return (
    <div className={`mb-8 flex items-center justify-center gap-2 ${currentStep === 1 ? "invisible" : ""}`}>
      {Array.from({ length: totalSteps - 1 }, (_, i) => {
        const step = i + 2;
        const isCompleted = step < currentStep;
        const isCurrent = step === currentStep;
        return (
          <div
            key={step}
            className="h-1.5 w-1.5 rounded-full transition-all"
            style={
              isCompleted
                ? { backgroundColor: "var(--accent)" }
                : isCurrent
                  ? { backgroundColor: "var(--accent-light)", transform: "scale(1.4)" }
                  : { backgroundColor: "var(--border)" }
            }
          />
        );
      })}
    </div>
  );
}
