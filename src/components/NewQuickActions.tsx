
import { Button } from "@/components/ui/button";
import { Plus, FileText, Mic, Sparkles } from "lucide-react";
import { SmartSearchWithBoundary as SmartSearch } from "@/components/SmartSearch";
import { SavedEntry } from "@/types/dashboard";
import { useNavigate } from "react-router-dom";

interface NewQuickActionsProps {
  onAddEntry: () => void;
  onCreateDocument: () => void;
  entries: SavedEntry[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onEntrySelect?: (entry: SavedEntry) => void;
}

export const NewQuickActions: React.FC<NewQuickActionsProps> = ({
  onAddEntry,
  onCreateDocument,
  entries,
  searchQuery,
  onSearchChange,
  onEntrySelect,
}) => {
  const navigate = useNavigate();

  const handleStartBrainDump = () => {
    sessionStorage.setItem("brain_dump_auto_start", JSON.stringify({ autoStart: true, autoSpeak: false }));
    navigate("/brain-dump");
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 md:p-5 mb-6 md:mb-8 space-y-5">
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-primary">
              <Sparkles className="w-3.5 h-3.5" />
              First memory path
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-card-foreground">Say one thing you don’t want to forget.</h3>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Speak. Anam will turn it into structured memory you own.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 md:min-w-[220px]">
            <Button onClick={handleStartBrainDump} className="flex items-center justify-center gap-2 flex-1">
              <Mic className="w-4 h-4" />
              Start Voice Dump
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3 text-xs font-medium text-foreground/90">
          <div className="rounded-lg bg-background/90 border border-border px-3 py-2">1. Speak naturally</div>
          <div className="rounded-lg bg-background/90 border border-border px-3 py-2">2. Review the structured memory</div>
          <div className="rounded-lg bg-background/90 border border-border px-3 py-2">3. Search and open it later</div>
        </div>
      </div>

      <div>
        <h3 className="text-base md:text-lg font-semibold text-card-foreground mb-1 md:mb-2">Quick Actions</h3>
        <p className="text-muted-foreground text-xs md:text-sm mb-3 md:mb-4">Capture by voice first. Use manual save only when you already know the details.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Button
            onClick={() => {
              console.log('Add Entry button clicked');
              onAddEntry();
            }}
            variant="outline"
            className="flex items-center space-x-2 flex-1 sm:flex-none min-w-[120px]"
            size="sm"
          >
            <Plus className="w-4 h-4" />
            <span>Save a Memory Manually</span>
          </Button>

          <Button
            onClick={() => {
              console.log('Create Document button clicked');
              onCreateDocument();
            }}
            variant="outline"
            className="flex items-center space-x-2 flex-1 sm:flex-none min-w-[120px]"
            size="sm"
          >
            <FileText className="w-4 h-4" />
            <span>Upload Document</span>
          </Button>
        </div>

        <div className="w-full sm:min-w-[200px] sm:flex-1 order-first sm:order-none mb-3 sm:mb-0">
          <SmartSearch
            entries={entries}
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            onEntrySelect={onEntrySelect}
            placeholder="Search entries..."
          />
        </div>
      </div>
    </div>
  );
};
