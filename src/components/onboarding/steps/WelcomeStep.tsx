import { OnboardingStep } from "../OnboardingStep";
import { Sparkles, Mic, Wand2, Search } from "lucide-react";

export function WelcomeStep() {
  return (
    <OnboardingStep
      icon={<Sparkles className="w-20 h-20 text-primary" />}
      title="Welcome to SaveMe"
      description="The fastest way to get value here is one voice dump."
    >
      <div className="space-y-8">
        <div className="space-y-4 text-center">
          <p className="text-lg text-foreground">
            Think of SaveMe as your <span className="font-semibold text-primary">second brain</span>, but don’t start by organizing. Start by unloading what is already in your head.
          </p>
        </div>

        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 text-left">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-2">Best first action</p>
          <h3 className="text-lg font-semibold text-foreground mb-2">Start with a voice dump</h3>
          <p className="text-sm text-muted-foreground">
            Say or type whatever is on your mind. Nova will organize your thoughts into structured notes, action items, and searchable memory.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 text-center">
          <div className="p-5 rounded-xl bg-gradient-to-b from-primary/10 to-transparent">
            <Mic className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Dump it</h3>
            <p className="text-sm text-muted-foreground">
              Speak or type naturally
            </p>
          </div>
          <div className="p-5 rounded-xl bg-gradient-to-b from-primary/10 to-transparent">
            <Wand2 className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Structure it</h3>
            <p className="text-sm text-muted-foreground">
              SaveMe organizes the mess
            </p>
          </div>
          <div className="p-5 rounded-xl bg-gradient-to-b from-primary/10 to-transparent">
            <Search className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-1">Find it later</h3>
            <p className="text-sm text-muted-foreground">
              Everything stays searchable
            </p>
          </div>
        </div>

        <p className="text-center text-muted-foreground text-sm">
          Takes about 1 minute. We’ll point you toward the fastest first win.
        </p>
      </div>
    </OnboardingStep>
  );
}
