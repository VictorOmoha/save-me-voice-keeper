
import React, { useEffect, useState } from "react";
import { useUnifiedVoiceProcessor } from "@/hooks/useUnifiedVoiceProcessor";
import { useVoiceFormContext } from "@/contexts/VoiceFormContext";
import { VoiceStatus } from "./voice/VoiceStatus";
import { VoiceControls } from "./voice/VoiceControls";
import { ConversationDisplay } from "./voice/ConversationDisplay";
import { SavedEntry } from "@/types/dashboard";
import { speechRecognition } from "@/utils/speechRecognitionSingleton";
import { toast } from "sonner";
import { speak } from "@/utils/textToSpeech";

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
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  // Always call hooks in the same order
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

  // Initialize speech recognition with singleton
  useEffect(() => {
    console.log('🎤 Conversational Voice Interface: Initializing speech recognition');
    
    if (!speechRecognition.isSupported()) {
      console.warn('Speech recognition not supported');
      return;
    }

    speechRecognition.setCallbacks({
      onResult: (transcript: string) => {
        console.log('🎯 Voice Interface: Processing transcript:', transcript);
        setLastTranscript(transcript);
        
        // Process the voice input through our unified processor
        processVoiceInput(transcript);
        
        // Dispatch transcript update event for debug panel
        window.dispatchEvent(new CustomEvent('voice-transcript-update', {
          detail: { transcript }
        }));
      },
      
      onStart: () => {
        console.log('🎤 Voice Interface: Recognition started');
        setIsListening(true);
      },
      
      onEnd: () => {
        console.log('🔚 Voice Interface: Recognition ended');
        setIsListening(false);
      },
      
      onError: (error: string) => {
        console.error('🚨 Voice Interface: Recognition error:', error);
        if (error === 'not-allowed') {
          toast.error('Microphone access denied. Please allow microphone access for voice features.');
          setIsActive(false);
        }
      }
    });

    return () => {
      speechRecognition.stop();
    };
  }, [processVoiceInput]);

  const activateConversation = () => {
    console.log('🚀 Voice Interface: Activating conversation');
    setIsActive(true);
    
    if (speechRecognition.start()) {
      toast.success('🎤 Voice mode activated - I\'m listening!');
      speak('Voice mode activated. How can I help you?');
    } else {
      toast.error('Failed to start voice recognition');
      setIsActive(false);
    }
  };

  const deactivateConversation = () => {
    console.log('🛑 Voice Interface: Deactivating conversation');
    setIsActive(false);
    speechRecognition.stop();
    toast.info('Voice mode deactivated');
  };

  // Early return after all hooks are called
  if (!speechRecognition.isSupported()) {
    return (
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari for voice features.
        </p>
      </div>
    );
  }

  // Create a unified conversation state for display
  const displayConversationState = {
    isActive: isActive || isInConversation,
    currentStep: conversationState.currentStep,
  };

  return (
    <div className="space-y-4">
      <VoiceStatus 
        isActive={isActive}
        isListening={isListening}
        isInConversation={isInConversation}
        conversationState={displayConversationState}
      />

      <VoiceControls
        isActive={isActive}
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

      <ConversationDisplay conversationState={displayConversationState} />

      {(isActive || isInConversation) && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
            🎤 Voice Mode Active
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            I'm listening for your commands. Try saying "create a new entry", "search documents", or "help".
          </p>
        </div>
      )}
    </div>
  );
};
