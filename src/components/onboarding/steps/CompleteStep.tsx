import { OnboardingStep } from "../OnboardingStep";
import { CheckCircle2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export function CompleteStep() {
  const navigate = useNavigate();

  return (
    <OnboardingStep
      icon={<CheckCircle2 className="w-20 h-20 text-green-500" />}
      title="You're All Set!"
      description="You're ready to start using SaveMe Voice Keeper."
    >
      <div className="space-y-6">
        <div className="grid gap-3 text-left">
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <h3 className="font-semibold text-green-600 dark:text-green-400 mb-2">Quick Recap</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Use the sidebar to navigate categories</li>
              <li>• Click + or use voice to add entries</li>
              <li>• Search to find anything instantly</li>
              <li>• Your data syncs across all devices</li>
            </ul>
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
            Read Full User Guide
          </Button>
        </div>
      </div>
    </OnboardingStep>
  );
}
