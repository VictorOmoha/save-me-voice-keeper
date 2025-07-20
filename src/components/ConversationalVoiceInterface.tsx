
import React, { useEffect, useState } from "react";
import { useVoiceOrchestrator } from "@/hooks/useVoiceOrchestrator";
import { useUnifiedVoiceProcessor } from "@/hooks/useUnifiedVoiceProcessor";
import { useVoiceFormContext } from "@/contexts/VoiceFormContext";
import { VoiceStatus } from "./voice/VoiceStatus";
import { VoiceControls } from "./voice/VoiceControls";
import { ConversationDisplay } from "./voice/ConversationDisplay";
import { SavedEntry } from "@/types/dashboard";

interface ConversationalVoiceInterfaceProps {
  savedEntries: SavedEntry[];
  onCreateEntry: () => void;
  onEditEntry: (entry: SavedEntry) => void;
  onDeleteEntry: (id: string) => void;
  onSaveEntry: (entry: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancelEdit: () => void;
}

export const ConversationalVoiceInterface: React.FC<ConversationalVoiceInterfaceProps> = ({
  savedEntries,
  onCreateEntry,
  onEditEntry,
  onDeleteEntry,
  onSaveEntry,
  onCancelEdit,
}) => {
  const [lastTranscript, setLastTranscript] = useState<string>("");
  const { formTitleSetter, formCategorySetter, formAddFieldFunction } = useVoiceFormContext();

  const {
    processVoiceInput,
    conversationState,
    cancelConversation,
    isInConversation,
  } = useUnifiedVoiceProcessor({
    savedEntries,
    onCreateEntry,
    onEditEntry,
    onDeleteEntry,
    onSaveEntry,
    onCancelEdit,
    formTitleSetter,
    formCategorySetter,
    formAddFieldFunction,
  });

  const {
    conversationState: orchestratorState,
    activateConversation,
    deactivateConversation,
    isSupported,
  } = useVoiceOrchestrator(processVoiceInput);

  // Show transcript updates
  useEffect(() => {
    const handleTranscriptUpdate = (event: CustomEvent) => {
      setLastTranscript(event.detail.transcript);
    };

    window.addEventListener('voice-transcript-update', handleTranscriptUpdate as EventListener);
    return () => window.removeEventListener('voice-transcript-update', handleTranscriptUpdate as EventListener);
  }, []);

  if (!isSupported) {
    return (
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari for voice features.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <VoiceStatus 
        isActive={orchestratorState.isActive}
        isListening={orchestratorState.isListening}
        isInConversation={isInConversation}
      />

      <VoiceControls
        isActive={orchestratorState.isActive}
        onActivate={activateConversation}
        onDeactivate={deactivateConversation}
        onCancelConversation={cancelConversation}
        isInConversation={isInConversation}
      />

      {lastTranscript && (
        <div className="p-3 bg-secondary rounded-lg">
          <p className="text-sm font-medium text-secondary-foreground">Last heard:</p>
          <p className="text-sm text-muted-foreground">"{lastTranscript}"</p>
        </div>
      )}

      <ConversationDisplay conversationState={conversationState} />

      {isInConversation && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
            🎤 Voice Conversation Active
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            I'm listening for your response. Speak naturally or say "cancel" to stop.
          </p>
        </div>
      )}
    </div>
  );
};
