import { OnboardingStep } from "../OnboardingStep";
import { Home, Search, Mic, Plus } from "lucide-react";

export function DashboardStep() {
  return (
    <OnboardingStep
      icon={<Home className="w-20 h-20 text-primary" />}
      title="Your Command Center"
      description="Everything you need, one glance away."
    >
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted/70 transition-colors">
            <div className="p-2 rounded-lg bg-primary/10">
              <Search className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold mb-1">Search Everything</h3>
              <p className="text-sm text-muted-foreground">
                Type or speak — find anything in seconds
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted/70 transition-colors">
            <div className="p-2 rounded-lg bg-primary/10">
              <Mic className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold mb-1">Voice Button</h3>
              <p className="text-sm text-muted-foreground">
                Click to speak — your fastest way in
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted/70 transition-colors">
            <div className="p-2 rounded-lg bg-primary/10">
              <Plus className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold mb-1">Quick Add</h3>
              <p className="text-sm text-muted-foreground">
                Add entries manually when you prefer
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted/70 transition-colors">
            <div className="p-2 rounded-lg bg-primary/10">
              <Home className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold mb-1">Recent Activity</h3>
              <p className="text-sm text-muted-foreground">
                Your latest entries, front and center
              </p>
            </div>
          </div>
        </div>
      </div>
    </OnboardingStep>
  );
}
