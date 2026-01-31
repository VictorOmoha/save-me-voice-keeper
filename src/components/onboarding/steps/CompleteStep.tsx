import { OnboardingStep } from "../OnboardingStep";
import { Rocket, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function CompleteStep() {
  const navigate = useNavigate();

  return (
    <OnboardingStep
      icon={<Rocket className="w-20 h-20 text-primary" />}
      title="You're Ready!"
      description="Your second brain is set up. Let's fill it."
    >
      <div className="space-y-6">
        <div className="p-6 rounded-xl bg-gradient-to-b from-green-500/10 to-transparent border border-green-500/20">
          <h3 className="font-semibold text-green-600 dark:text-green-400 mb-4 text-center">
            🎯 Quick Start Challenge
          </h3>
          <p className="text-center text-muted-foreground mb-4">
            Try saving one thing right now:
          </p>
          <div className="grid gap-2 text-sm">
            <div className="p-3 rounded-lg bg-background/50 text-center">
              🎤 "Save my wifi password: [your password]"
            </div>
            <div className="p-3 rounded-lg bg-background/50 text-center">
              🎤 "My emergency contact is [name], [number]"
            </div>
            <div className="p-3 rounded-lg bg-background/50 text-center">
              🎤 "Remember: [anything on your mind]"
            </div>
          </div>
        </div>
        
        <div className="flex justify-center">
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
