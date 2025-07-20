
import { SavedEntry } from "@/types/dashboard";
import { SimpleVoiceCommand } from "@/utils/simpleVoiceProcessor";
import { useVoiceCommandExecutor } from "./useVoiceCommandExecutor";

interface UseDashboardVoiceProps {
  savedEntries: SavedEntry[];
  showAddEntry: boolean;
  setShowAddEntry: (show: boolean) => void;
  setEditingEntry: (entry: SavedEntry | null) => void;
  setFillingEntry: (entry: SavedEntry | null) => void;
  deleteEntry: (id: string) => void;
  editEntry: (entry: SavedEntry) => void;
  fillEntry: (entry: SavedEntry) => void;
  handleCancelEdit: () => void;
  saveEntry: (entry: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  editingEntry?: SavedEntry | null;
  fillingEntry?: SavedEntry | null;
}

export const useDashboardVoice = ({
  savedEntries,
  showAddEntry,
  setShowAddEntry,
  setEditingEntry,
  setFillingEntry,
  deleteEntry,
  editEntry,
  fillEntry,
  handleCancelEdit,
  saveEntry,
  editingEntry,
  fillingEntry,
}: UseDashboardVoiceProps) => {
  
  const { executeCommand } = useVoiceCommandExecutor({
    savedEntries,
    onAddEntry: () => setShowAddEntry(true),
    onEditEntry: editEntry,
    onDeleteEntry: deleteEntry,
    onCancelEdit: handleCancelEdit,
    showAddEntry,
    editingEntry,
  });

  const handleVoiceCommand = (command: SimpleVoiceCommand) => {
    console.log('Dashboard executing voice command:', command);
    executeCommand(command);
  };

  return {
    handleVoiceCommand,
  };
};
