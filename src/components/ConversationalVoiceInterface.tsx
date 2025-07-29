
import React, { useEffect, useState, useRef } from "react";
import { useVoiceFormContext } from "@/contexts/VoiceFormContext";
import { VoiceStatus } from "./voice/VoiceStatus";
import { VoiceControls } from "./voice/VoiceControls";
import { ConversationDisplay } from "./voice/ConversationDisplay";
import { SavedEntry } from "@/types/dashboard";
import { speechRecognition } from "@/utils/speechRecognitionSingleton";
import { toast } from "sonner";
import { speak } from "@/utils/textToSpeech";
import { useUnifiedVoiceProcessor } from "@/hooks/useUnifiedVoiceProcessor";
import { useTTSEventHandler } from "@/hooks/useTTSEventHandler";

interface ConversationalVoiceInterfaceProps {
  savedEntries: SavedEntry[];
  onCreateEntry: () => void;
  onEditEntry: (entry: SavedEntry) => void;
  onDeleteEntry: (id: string) => void;
  onSaveEntry: (entry: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancelEdit: () => void;
  onEnhancedVoiceInput?: (transcript: string) => Promise<void>;
}

export const ConversationalVoiceInterface: React.FC<ConversationalVoiceInterfaceProps> = ({
  savedEntries,
  onCreateEntry,
  onEditEntry,
  onDeleteEntry,
  onSaveEntry,
  onCancelEdit,
  onEnhancedVoiceInput,
}) => {
  const [lastTranscript, setLastTranscript] = useState<string>("");
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  // Create a ref to track the recognition instance for TTS event handler
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  // Get form context if available
  const formContext = useVoiceFormContext();

  // Use the unified voice processor for proper conversation flow
  const {
    processVoiceInput,
    conversationState,
    cancelConversation,
    isInConversation
  } = useUnifiedVoiceProcessor({
    onCreateEntry,
    onEditEntry,
    onDeleteEntry,
    onSaveEntry,
    onCancelEdit,
    savedEntries,
    formTitleSetter: formContext?.formTitleSetter || undefined,
    formCategorySetter: formContext?.formCategorySetter || undefined,
    formAddFieldFunction: formContext?.formAddFieldFunction || undefined
  });

  // Use TTS event handler to restart recognition after TTS completes
  useTTSEventHandler({
    conversationState: { isActive },
    isListening,
    recognitionRef,
    setIsListening,
  });

  // Handle voice input with unified processor or dashboard handler
  const handleVoiceInput = async (transcript: string) => {
    console.log('🎙️ ConversationalVoiceInterface: Processing voice input:', transcript);
    
    // Skip very short inputs
    if (transcript.trim().length < 2) {
      console.log('🚫 ConversationalVoiceInterface: Input too short, skipping');
      return;
    }
    
    try {
      // Check the actual conversation state from the unified processor
      const actuallyInConversation = isInConversation || conversationState.isInConversation;
      console.log('🔍 ConversationalVoiceInterface: Conversation state check - interface:', isInConversation, 'unified:', conversationState.isInConversation, 'actual:', actuallyInConversation);
      
      // Always use internal processor to maintain conversation state
      // If we're in conversation mode, the dashboard handler should not interfere
      if (actuallyInConversation) {
        console.log('🔧 ConversationalVoiceInterface: In conversation - using internal unified processor');
        await processVoiceInput(transcript);
      } else if (onEnhancedVoiceInput) {
        console.log('🌉 ConversationalVoiceInterface: Not in conversation - using dashboard enhanced voice handler');
        await onEnhancedVoiceInput(transcript);
      } else {
        console.log('🔧 ConversationalVoiceInterface: Using internal unified processor as fallback');
        await processVoiceInput(transcript);
      }
    } catch (error) {
      console.error('❌ ConversationalVoiceInterface: Error processing voice input:', error);
      toast.error('Sorry, I had trouble understanding that command.');
      speak('Sorry, I had trouble understanding that. Could you try again?');
    }
  };

  // Initialize speech recognition - only set callbacks, don't start automatically
  useEffect(() => {
    console.log('🎤 ConversationalVoiceInterface: Setting up speech recognition callbacks');
    
    if (!speechRecognition.isSupported()) {
      console.warn('Speech recognition not supported');
      return;
    }

    speechRecognition.setCallbacks({
      onResult: (transcript: string) => {
        console.log('🎯 ConversationalVoiceInterface: Received transcript:', transcript);
        setLastTranscript(transcript);
        
        // Process the voice input with unified processor
        handleVoiceInput(transcript);
        
        // Dispatch transcript update event for debug panel
        window.dispatchEvent(new CustomEvent('voice-transcript-update', {
          detail: { transcript }
        }));
      },
      
      onStart: () => {
        console.log('🎤 ConversationalVoiceInterface: Recognition started');
        setIsListening(true);
      },
      
      onEnd: () => {
        console.log('🔚 ConversationalVoiceInterface: Recognition ended');
        setIsListening(false);
      },
      
      onError: (error: string) => {
        console.error('🚨 ConversationalVoiceInterface: Recognition error:', error);
        if (error === 'not-allowed') {
          toast.error('Microphone access denied. Please allow microphone access for voice features.');
          setIsActive(false);
        }
      }
    });

    return () => {
      if (isActive) {
        speechRecognition.stop();
      }
    };
  }, [])

  const activateConversation = () => {
    console.log('🚀 ConversationalVoiceInterface: Activating conversation');
    setIsActive(true);
    
    if (speechRecognition.start()) {
      // Store the recognition instance for TTS event handler
      recognitionRef.current = speechRecognition.getRecognition();
      toast.success('🎤 Voice mode activated - I\'m listening!');
      speak('Voice mode activated. How can I help you?');
    } else {
      toast.error('Failed to start voice recognition');
      setIsActive(false);
    }
  };

  const deactivateConversation = () => {
    console.log('🛑 ConversationalVoiceInterface: Deactivating conversation');
    setIsActive(false);
    speechRecognition.stop();
    cancelConversation();
    toast.info('Voice mode deactivated');
  };

  const handleCancelConversation = () => {
    console.log('❌ ConversationalVoiceInterface: Cancelling conversation');
    setIsActive(false);
    speechRecognition.stop();
    cancelConversation();
    toast.info('Voice conversation cancelled');
  };

  // Early return if not supported
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
    waitingForFollowUp: conversationState.isInConversation,
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
        onCancelConversation={handleCancelConversation}
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
            {isInConversation && conversationState.currentStep
              ? conversationState.currentStep.question || "Tell me what information to add to your entry..."
              : 'Try: "create a new entry", "open [entry name]", "delete [entry name]", "search for [term]", or "help"'
            }
          </p>
        </div>
      )}
    </div>
  );
};
