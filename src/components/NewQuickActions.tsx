
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

  const handleQuickCapture = () => {
    window.dispatchEvent(new CustomEvent("saveme:quick-capture"));
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 md:p-6 mb-6 md:mb-8 space-y-5">
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-primary">
              <Sparkles className="w-3.5 h-3.5" />
              Fastest way to use SaveMe
            </div>
            <h3 className="text-lg md:text-xl font-semibold text-card-foreground">Start with a voice dump</h3>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Speak freely. Nova will organize it into a memory you can find later.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 md:min-w-[320px]">
            <Button onClick={handleStartBrainDump} className="flex items-center justify-center gap-2 flex-1">
              <Mic className="w-4 h-4" />
              Voice Dump
            </Button>
            <Button onClick={handleQuickCapture} variant="outline" className="flex items-center justify-center gap-2 flex-1">
              <Plus className="w-4 h-4" />
              Save Memory
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3 text-xs text-muted-foreground">
          <div className="rounded-lg bg-background/80 border px-3 py-2">1. Dump thoughts fast</div>
          <div className="rounded-lg bg-background/80 border px-3 py-2">2. Process into structure</div>
          <div className="rounded-lg bg-background/80 border px-3 py-2">3. Save to your archive</div>
        </div>
      </div>

      <div>
        <h3 className="text-base md:text-lg font-semibold text-card-foreground mb-1 md:mb-2">Quick Actions</h3>
        <p className="text-muted-foreground text-xs md:text-sm mb-3 md:mb-4">Capture a memory, add structured details, or search your archive</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Button
            onClick={handleStartBrainDump}
            className="flex items-center space-x-2 flex-1 sm:flex-none min-w-[140px]"
            size="sm"
          >
            <Mic className="w-4 h-4" />
            <span>Voice Dump</span>
          </Button>

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
            <span>Save Memory</span>
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
