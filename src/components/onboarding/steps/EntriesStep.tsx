import { OnboardingStep } from "../OnboardingStep";
import { FileText, Heart, Users, Wallet, User, FolderOpen } from "lucide-react";

const categories = [
  { icon: FileText, name: "Documents", examples: "IDs, contracts, certificates" },
  { icon: Heart, name: "Health", examples: "Meds, doctors, appointments" },
  { icon: Users, name: "Contacts", examples: "People, businesses, emergency" },
  { icon: Wallet, name: "Finance", examples: "Accounts, cards, insurance" },
  { icon: User, name: "Personal", examples: "Notes, ideas, memories" },
];

export function EntriesStep() {
  return (
    <OnboardingStep
      icon={<FolderOpen className="w-20 h-20 text-primary" />}
      title="Your collections"
      description="A place for the details you want to keep."
    >
      <div className="space-y-6">
        <p className="text-center text-muted-foreground">
          Nova suggests a collection for your memories. You can also choose one yourself:
        </p>
        
        <div className="grid gap-2">
          {categories.map((cat) => (
            <div
              key={cat.name}
              className="flex items-center gap-4 p-3 rounded-xl bg-muted/50 hover:bg-muted/70 transition-colors"
            >
              <cat.icon className="h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0 text-left flex-1">
                <span className="font-semibold">{cat.name}</span>
                <p className="mt-1 text-sm text-muted-foreground">{cat.examples}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-sm text-muted-foreground text-center">
          To move a memory, edit it and choose another collection.
        </p>
      </div>
    </OnboardingStep>
  );
}
