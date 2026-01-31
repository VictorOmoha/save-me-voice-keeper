import { OnboardingStep } from "../OnboardingStep";
import { Mic } from "lucide-react";

const examples = [
  { 
    say: "Save my doctor's number: 555-1234", 
    result: "→ Saved to Contacts" 
  },
  { 
    say: "My passport expires December 2025", 
    result: "→ Saved to Documents" 
  },
  { 
    say: "Find my wifi password", 
    result: "→ Searches all entries" 
  },
  { 
    say: "What's my dentist's address?", 
    result: "→ Finds matching entry" 
  },
];

export function VoiceStep() {
  return (
    <OnboardingStep
      icon={<Mic className="w-20 h-20 text-primary" />}
      title="Just Talk"
      description="No buttons. No menus. Just say what you need."
    >
      <div className="space-y-6">
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
              Talk naturally — SaveMe understands context, not just keywords.
            </span>
          </p>
        </div>
      </div>
    </OnboardingStep>
  );
}
