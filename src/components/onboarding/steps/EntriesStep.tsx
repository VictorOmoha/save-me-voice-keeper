import { OnboardingStep } from "../OnboardingStep";
import { Database } from "lucide-react";

const categories = [
  { icon: "📄", name: "Documents", desc: "Contracts, certificates, IDs" },
  { icon: "🏥", name: "Health", desc: "Medical records, prescriptions" },
  { icon: "👥", name: "Contacts", desc: "People, businesses, emergency" },
  { icon: "💰", name: "Finance", desc: "Bank info, investments, insurance" },
  { icon: "👤", name: "Personal", desc: "Notes, memories, goals" },
];

export function EntriesStep() {
  return (
    <OnboardingStep
      icon={<Database className="w-20 h-20 text-primary" />}
      title="Organize Your Data"
      description="Store any type of information in organized categories."
    >
      <div className="space-y-6">
        <div className="grid gap-3">
          {categories.map((cat) => (
            <div
              key={cat.name}
              className="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
            >
              <span className="text-2xl">{cat.icon}</span>
              <div className="text-left">
                <h3 className="font-semibold">{cat.name}</h3>
                <p className="text-sm text-muted-foreground">{cat.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Each entry can have custom fields, attachments, and notes.
        </p>
      </div>
    </OnboardingStep>
  );
}
