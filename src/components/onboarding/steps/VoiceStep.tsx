import { OnboardingStep } from "../OnboardingStep";
import { Mic } from "lucide-react";

const voiceCommands = [
  { command: "Add a new health entry", desc: "Create entries with voice" },
  { command: "Show my documents", desc: "Navigate to categories" },
  { command: "Search for passport", desc: "Find entries instantly" },
  { command: "Create a new contact", desc: "Add people quickly" },
];

export function VoiceStep() {
  return (
    <OnboardingStep
      icon={<Mic className="w-20 h-20 text-primary" />}
      title="Voice Commands"
      description="Talk to SaveMe naturally. Click the microphone or just speak."
    >
      <div className="space-y-6">
        <div className="grid gap-3">
          {voiceCommands.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
            >
              <div className="text-left">
                <p className="font-mono text-sm text-primary">"{item.command}"</p>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 rounded-lg border border-dashed">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Pro tip:</span> Voice commands are optional.
            You can always use the traditional UI to manage your data.
          </p>
        </div>
      </div>
    </OnboardingStep>
  );
}
