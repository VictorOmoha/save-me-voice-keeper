import { OnboardingStep } from "../OnboardingStep";
import { Sparkles } from "lucide-react";

export function WelcomeStep() {
  return (
    <OnboardingStep
      icon={<Sparkles className="w-20 h-20 text-primary" />}
      title="Welcome to SaveMe"
      description="You're about to change how you remember everything."
    >
      <div className="space-y-8">
        <div className="space-y-4 text-center">
          <p className="text-lg text-foreground">
            Think of SaveMe as your <span className="font-semibold text-primary">second brain</span> — 
            a place where everything important lives, organized and searchable.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 text-center">
          <div className="p-5 rounded-xl bg-gradient-to-b from-primary/10 to-transparent">
            <div className="text-3xl mb-3">🎤</div>
            <h3 className="font-semibold mb-1">Speak</h3>
            <p className="text-sm text-muted-foreground">
              Just talk — we'll capture it
            </p>
          </div>
          <div className="p-5 rounded-xl bg-gradient-to-b from-primary/10 to-transparent">
            <div className="text-3xl mb-3">✨</div>
            <h3 className="font-semibold mb-1">Auto-Organize</h3>
            <p className="text-sm text-muted-foreground">
              AI sorts it for you
            </p>
          </div>
          <div className="p-5 rounded-xl bg-gradient-to-b from-primary/10 to-transparent">
            <div className="text-3xl mb-3">🔍</div>
            <h3 className="font-semibold mb-1">Find Instantly</h3>
            <p className="text-sm text-muted-foreground">
              Search anything, anytime
            </p>
          </div>
        </div>

        <p className="text-center text-muted-foreground text-sm">
          Takes about 1 minute. Let's show you around!
        </p>
      </div>
    </OnboardingStep>
  );
}
