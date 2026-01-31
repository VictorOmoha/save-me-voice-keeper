import { OnboardingStep } from "../OnboardingStep";
import { FolderOpen } from "lucide-react";

const categories = [
  { icon: "📄", name: "Documents", examples: "IDs, contracts, certificates" },
  { icon: "🏥", name: "Health", examples: "Meds, doctors, appointments" },
  { icon: "👥", name: "Contacts", examples: "People, businesses, emergency" },
  { icon: "💰", name: "Finance", examples: "Accounts, cards, insurance" },
  { icon: "👤", name: "Personal", examples: "Notes, ideas, memories" },
];

export function EntriesStep() {
  return (
    <OnboardingStep
      icon={<FolderOpen className="w-20 h-20 text-primary" />}
      title="Smart Categories"
      description="We organize. You just save."
    >
      <div className="space-y-6">
        <p className="text-center text-muted-foreground">
          When you save something, AI automatically puts it in the right place:
        </p>
        
        <div className="grid gap-2">
          {categories.map((cat) => (
            <div
              key={cat.name}
              className="flex items-center gap-4 p-3 rounded-xl bg-muted/50 hover:bg-muted/70 transition-colors"
            >
              <span className="text-2xl w-10 text-center">{cat.icon}</span>
              <div className="text-left flex-1">
                <span className="font-semibold">{cat.name}</span>
                <span className="text-muted-foreground mx-2">—</span>
                <span className="text-sm text-muted-foreground">{cat.examples}</span>
              </div>
            </div>
          ))}
        </div>

        <p className="text-sm text-muted-foreground text-center">
          Don't like where something landed? Move it with one click.
        </p>
      </div>
    </OnboardingStep>
  );
}
