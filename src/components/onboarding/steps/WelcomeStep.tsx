import { OnboardingStep } from "../OnboardingStep";
import { Shield } from "lucide-react";

export function WelcomeStep() {
  return (
    <OnboardingStep
      icon={<Shield className="w-20 h-20 text-primary" />}
      title="Welcome to SaveMe Voice Keeper"
      description="Your voice-powered personal data assistant. Keep everything important organized and accessible."
    >
      <div className="space-y-6 text-left">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="text-2xl mb-2">🎤</div>
            <h3 className="font-semibold mb-1">Voice-First</h3>
            <p className="text-sm text-muted-foreground">
              Add and find data using natural voice commands
            </p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="text-2xl mb-2">🔒</div>
            <h3 className="font-semibold mb-1">Secure</h3>
            <p className="text-sm text-muted-foreground">
              Your data is encrypted and protected
            </p>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="text-2xl mb-2">📱</div>
            <h3 className="font-semibold mb-1">Accessible</h3>
            <p className="text-sm text-muted-foreground">
              Access your data from any device, anywhere
            </p>
          </div>
        </div>
        <p className="text-center text-muted-foreground">
          Let's take a quick tour to get you started!
        </p>
      </div>
    </OnboardingStep>
  );
}
