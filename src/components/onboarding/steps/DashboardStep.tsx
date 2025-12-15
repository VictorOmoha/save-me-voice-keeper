import { OnboardingStep } from "../OnboardingStep";
import { LayoutDashboard, Search, FolderOpen, Plus } from "lucide-react";

export function DashboardStep() {
  return (
    <OnboardingStep
      icon={<LayoutDashboard className="w-20 h-20 text-primary" />}
      title="Your Dashboard"
      description="Everything you need is organized in one place."
    >
      <div className="space-y-6 text-left">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
            <FolderOpen className="w-6 h-6 text-primary mt-0.5" />
            <div>
              <h3 className="font-semibold mb-1">Categories</h3>
              <p className="text-sm text-muted-foreground">
                Organize data into Documents, Health, Contacts, Finance, and Personal
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
            <Search className="w-6 h-6 text-primary mt-0.5" />
            <div>
              <h3 className="font-semibold mb-1">Quick Search</h3>
              <p className="text-sm text-muted-foreground">
                Find any entry instantly with powerful search
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
            <Plus className="w-6 h-6 text-primary mt-0.5" />
            <div>
              <h3 className="font-semibold mb-1">Add Entry</h3>
              <p className="text-sm text-muted-foreground">
                Click the + button to add new data manually
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
            <LayoutDashboard className="w-6 h-6 text-primary mt-0.5" />
            <div>
              <h3 className="font-semibold mb-1">Recent Entries</h3>
              <p className="text-sm text-muted-foreground">
                See your most recent data at a glance
              </p>
            </div>
          </div>
        </div>
      </div>
    </OnboardingStep>
  );
}
