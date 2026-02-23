
import React, { useEffect, useRef } from "react";
import { ConversationalVoiceInterface } from "./ConversationalVoiceInterface";
import { SavedEntry } from "@/types/dashboard";
import { logVoice, logWarn } from "@/utils/logger";

interface FloatingVoiceInputProps {
  onEnhancedVoiceInput?: (text: string) => void;
  isVoiceProcessing?: boolean;
  lastVoiceCommand?: unknown;
  conversationState?: 'listening' | 'confirming' | 'idle';
  hasPendingConfirmation?: boolean;
  onCancelVoice?: () => void;
  conversationData?: { isActive: boolean; currentStep?: { question: string } };
  // Dashboard props passed through
  savedEntries?: SavedEntry[];
  onCreateEntry?: () => void;
  onEditEntry?: (entry: SavedEntry) => void;
  onDeleteEntry?: (id: string) => void;
  onSaveEntry?: (entry: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancelEdit?: () => void;
}

export const FloatingVoiceInput: React.FC<FloatingVoiceInputProps> = ({
  onEnhancedVoiceInput,
  savedEntries = [],
  onCreateEntry = () => {},
  onEditEntry = () => {},
  onDeleteEntry = () => {},
  onSaveEntry = () => {},
  onCancelEdit = () => {},
}) => {
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Auto-initialize voice input only once
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      logVoice('FloatingVoiceInput connected to Dashboard voice system');
    }
  }, []);

  // Direct voice handler that bypasses the conversation interface routing
  const handleVoiceInput = async (transcript: string) => {
    logVoice('Direct voice input to dashboard', transcript);
    if (!onEnhancedVoiceInput) {
      logWarn('No onEnhancedVoiceInput handler provided. Ignoring transcript.');
      return;
    }
    await onEnhancedVoiceInput(transcript);
  };
  return (
    <div className="fixed bottom-4 right-4 md:right-20 z-40">
      <ConversationalVoiceInterface
        savedEntries={savedEntries}
        onCreateEntry={onCreateEntry}
        onEditEntry={onEditEntry}
        onDeleteEntry={onDeleteEntry}
        onSaveEntry={onSaveEntry}
        onCancelEdit={onCancelEdit}
        onEnhancedVoiceInput={handleVoiceInput}
      />
    </div>
  );
};
