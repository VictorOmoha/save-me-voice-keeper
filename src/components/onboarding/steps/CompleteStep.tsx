import { OnboardingStep } from "../OnboardingStep";
import { Rocket, BookOpen, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function CompleteStep() {
  const navigate = useNavigate();

  return (
    <OnboardingStep
      icon={<Rocket className="w-20 h-20 text-primary" />}
      title="You're Ready!"
      description="Now get your first win with one voice dump."
    >
      <div className="space-y-6">
        <div className="p-6 rounded-xl bg-gradient-to-b from-green-500/10 to-transparent border border-green-500/20">
          <h3 className="font-semibold text-green-600 dark:text-green-400 mb-4 text-center">
            🎯 First voice dump
          </h3>
          <p className="text-center text-muted-foreground mb-4">
            Start with one of these and let Nova organize it for you:
          </p>
          <div className="grid gap-2 text-sm">
            <div className="p-3 rounded-lg bg-background/50 text-center">
              🎤 "Here’s everything I need to do tomorrow..."
            </div>
            <div className="p-3 rounded-lg bg-background/50 text-center">
              🎤 "I need to remember these life admin tasks..."
            </div>
            <div className="p-3 rounded-lg bg-background/50 text-center">
              🎤 "Here’s what’s been on my mind lately..."
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Button onClick={() => navigate('/brain-dump')} className="gap-2">
            <Mic className="w-4 h-4" />
            Start voice dump
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/user-guide')}
            className="gap-2"
          >
            <BookOpen className="w-4 h-4" />
            Full User Guide
          </Button>
        </div>
      </div>
    </OnboardingStep>
  );
}
