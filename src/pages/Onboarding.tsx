import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { WelcomeStep } from "@/components/onboarding/steps/WelcomeStep";
import { DashboardStep } from "@/components/onboarding/steps/DashboardStep";
import { EntriesStep } from "@/components/onboarding/steps/EntriesStep";
import { VoiceStep } from "@/components/onboarding/steps/VoiceStep";
import { CompleteStep } from "@/components/onboarding/steps/CompleteStep";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { logError } from "@/utils/logger";

const steps = [
  { id: "welcome", component: WelcomeStep },
  { id: "dashboard", component: DashboardStep },
  { id: "entries", component: EntriesStep },
  { id: "voice", component: VoiceStep },
  { id: "complete", component: CompleteStep },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);

  // Check if user is authenticated
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
  };

  const handleComplete = async () => {
    await completeOnboarding();
  };

  const completeOnboarding = async () => {
    if (!user || isCompleting) return;

    setIsCompleting(true);
    try {
      // Update user preferences in Firebase Firestore
      const prefsRef = doc(db, 'user_preferences', user.uid);
      await setDoc(prefsRef, {
        user_id: user.uid,
        has_completed_onboarding: true,
        updated_at: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      logError("Error completing onboarding:", err);
    } finally {
      setIsCompleting(false);
      navigate("/dashboard");
    }
  };

  const CurrentStepComponent = steps[currentStep].component;
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Skip button */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSkip}
          disabled={isCompleting}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4 mr-1" />
          Skip
        </Button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <CurrentStepComponent />
        </div>
      </div>

      {/* Footer with navigation */}
      <div className="p-6 border-t">
        <div className="max-w-2xl mx-auto">
          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-6">
            {steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => setCurrentStep(index)}
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-colors",
                  index === currentStep
                    ? "bg-primary"
                    : index < currentStep
                    ? "bg-primary/50"
                    : "bg-muted-foreground/30"
                )}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isFirstStep || isCompleting}
              className={cn(isFirstStep && "invisible")}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>

            <span className="text-sm text-muted-foreground">
              {currentStep + 1} of {steps.length}
            </span>

            {isLastStep ? (
              <Button onClick={handleComplete} disabled={isCompleting}>
                {isCompleting ? "Starting..." : "Get Started"}
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={isCompleting}>
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
