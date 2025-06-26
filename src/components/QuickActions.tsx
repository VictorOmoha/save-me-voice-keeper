
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VoiceInput } from "@/components/VoiceInput";
import { VoiceCommand } from "@/utils/voiceCommandProcessor";

interface QuickActionsProps {
  savedEntriesCount: number;
  onAddEntry: () => void;
  onVoiceResult: (text: string) => void;
  onVoiceCommand: (command: VoiceCommand) => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  savedEntriesCount,
  onAddEntry,
  onVoiceResult,
  onVoiceCommand,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={onAddEntry}>
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <span className="text-2xl">➕</span>
          </div>
          <CardTitle className="text-lg">Add New Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-center">Quickly save any information</p>
        </CardContent>
      </Card>

      <VoiceInput 
        onVoiceResult={onVoiceResult}
        onVoiceCommand={onVoiceCommand}
      />

      <Card>
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <span className="text-2xl">📊</span>
          </div>
          <CardTitle className="text-lg">Your Stats</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <div className="text-2xl font-bold text-blue-600 mb-1">{savedEntriesCount}</div>
          <p className="text-gray-600">Entries saved</p>
        </CardContent>
      </Card>
    </div>
  );
};
