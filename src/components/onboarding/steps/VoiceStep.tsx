import { OnboardingStep } from "../OnboardingStep";
import { Mic } from "lucide-react";

const examples = [
  {
    say: "I need to follow up with Daniel tomorrow, redesign the homepage CTA, and test onboarding tonight",
    result: "→ Turned into action items and organized notes"
  },
  {
    say: "Remember that my passport expires December 2025 and I need to renew it this fall",
    result: "→ Saved with useful context"
  },
  {
    say: "I have an idea for SaveMe: make Brain Dump the main entry point",
    result: "→ Saved as an idea you can find later"
  },
  {
    say: "What was that note about my dentist?",
    result: "→ Searches your vault for the match"
  },
];

export function VoiceStep() {
  return (
    <OnboardingStep
      icon={<Mic className="w-20 h-20 text-primary" />}
      title="Start with a voice dump"
      description="Don’t worry about saying it perfectly. Just get it out."
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 text-left">
          <p className="text-sm font-medium text-foreground mb-2">Your first win should feel like this:</p>
          <p className="text-sm text-muted-foreground">
            unload a messy thought, let SaveMe structure it, then save it without breaking your flow.
          </p>
        </div>

        <div className="grid gap-3">
          {examples.map((item, index) => (
            <div
              key={index}
              className="p-4 rounded-xl bg-muted/50"
            >
              <div className="flex items-start gap-3">
                <span className="text-lg">🎤</span>
                <div className="flex-1 text-left">
                  <p className="font-medium text-foreground">"{item.say}"</p>
                  <p className="text-sm text-primary mt-1">{item.result}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-xl border border-dashed border-primary/30 bg-primary/5">
          <p className="text-sm text-center">
            <span className="font-semibold text-primary">💡 Pro tip:</span>{" "}
            <span className="text-muted-foreground">
              Messy is fine. Voice dump works best when you stop editing yourself and capture first.
            </span>
          </p>
        </div>
      </div>
    </OnboardingStep>
  );
}
