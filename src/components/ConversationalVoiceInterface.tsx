import React, { useEffect, useState, useRef } from "react";
import { useVoiceFormContext } from "@/contexts/VoiceFormContext";
import { VoiceStatus } from "./voice/VoiceStatus";
import { VoiceControls } from "./voice/VoiceControls";
import { ConversationDisplay } from "./voice/ConversationDisplay";
import { SavedEntry } from "@/types/dashboard";
import { speechRecognition } from "@/utils/speechRecognitionSingleton";
import { toast } from "sonner";
import { speak } from "@/utils/textToSpeech";
import { useVoiceProcessor } from "@/voice";
import { useTTSEventHandler } from "@/hooks/useTTSEventHandler";
import { errorTracker } from "@/utils/errorTracker";
import { performanceMonitor } from "@/utils/performanceMonitor";

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

  // Use the voice processor for command processing
  const {
    processVoiceInput,
    conversationState,
    pendingDeleteEntry,
    startCreateEntryConversation,
    endConversation,
  } = useVoiceProcessor({
    savedEntries,
    onCreateEntry,
    onEditEntry,
    onDeleteEntry,
    onSaveEntry,
    onCancelEdit,
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

  // Handle voice input with optimized processor or dashboard handler
  const handleVoiceInput = async (transcript: string) => {
    performanceMonitor.startTimer('voice-input-processing', 'voice');
    
    try {
      // Skip very short inputs
      if (transcript.trim().length < 2) {
        errorTracker.logInfo('voice', 'Input too short, skipping', { transcript });
        return;
      }
      
      // Check if this looks like TTS feedback
      const lowerTranscript = transcript.toLowerCase();
      if (lowerTranscript.includes('what would you like to call') ||
          lowerTranscript.includes('what category should') ||
          lowerTranscript.includes('perfect entry preview') ||
          lowerTranscript.includes('voice mode activated') ||
          lowerTranscript.includes('how can i help you')) {
        errorTracker.logInfo('voice', 'Detected TTS feedback, ignoring', { transcript });
        return;
      }
      
      // Allow navigation intents even during conversations
      const brainDumpRegex = /(open|start|go to|launch)?\s*(the\s*)?(brain\s?-?dump|braindump)/;
      if (brainDumpRegex.test(lowerTranscript)) {
        speak('Opening Brain Dump');
        // Persist auto-start intent for the destination page
        try {
          sessionStorage.setItem('brain_dump_auto_start', JSON.stringify({ autoStart: true, autoSpeak: true }));
        } catch {}
        window.dispatchEvent(new CustomEvent('voice-navigate', {
          detail: { destination: 'brain-dump', params: { autoStart: true, autoSpeak: true } }
        }));
        // Stop current conversation/listening
        setIsActive(false);
        speechRecognition.stop();
        endConversation();
        return;
      }

      // Check the actual conversation state from the optimized processor
      const actuallyInConversation = conversationState.isInConversation;
      
      // Brain Dump process/save commands (global) - allow regardless of conversation state
      const processBrainDump = /(process|structure|analy[sz]e|summari[sz]e)\s+(the\s+)?(brain\s?-?dump)/;
      const saveBrainDump = /(save|store|commit)\s+(the\s+)?(brain\s?-?dump)(?:\s+(?:as|to|in|under)\s+([a-zA-Z\s-]+))?/;
      if (processBrainDump.test(lowerTranscript)) {
        speak('Processing your brain dump.');
        window.dispatchEvent(new CustomEvent('brain-dump:process'));
        return;
      }
      const saveMatch = lowerTranscript.match(saveBrainDump);
      if (saveMatch) {
        const desiredCategoryRaw = saveMatch[4];
        speak('Saving your brain dump.');
        window.dispatchEvent(new CustomEvent('brain-dump:save', { detail: { category: desiredCategoryRaw } }));
        return;
      }

      // Always use internal processor for voice commands
      // The internal processor handles all commands including create, open, delete, search, etc.
      await processVoiceInput(transcript);
    } catch (error) {
      errorTracker.logError('voice', 'Error processing voice input', { transcript }, error as Error);
      toast.error('Sorry, I had trouble understanding that command.');
      speak('Sorry, I had trouble understanding that. Could you try again?');
    } finally {
      performanceMonitor.endTimer('voice-input-processing', 'voice');
    }
  };

  // Initialize speech recognition - only set callbacks, don't start automatically
  useEffect(() => {
    if (!speechRecognition.isSupported()) {
      errorTracker.logWarning('voice', 'Speech recognition not supported');
      return;
    }

    speechRecognition.setCallbacks({
      onResult: (transcript: string) => {
        setLastTranscript(transcript);
        handleVoiceInput(transcript);
        
        // Dispatch transcript update event for debug panel
        window.dispatchEvent(new CustomEvent('voice-transcript-update', {
          detail: { transcript }
        }));
      },
      
      onStart: () => {
        setIsListening(true);
      },
      
onEnd: () => {
        setIsListening(false);
        // Let the singleton manage restarts; avoid duplicate restarts here
      },
      
      onError: (error: string) => {
        errorTracker.logError('voice', 'Recognition error', { error });
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
  }, []);

  const activateConversation = () => {
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
    setIsActive(false);
    speechRecognition.stop();
    endConversation();
    toast.info('Voice mode deactivated');
  };

  const handleCancelConversation = () => {
    setIsActive(false);
    speechRecognition.stop();
    endConversation();
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
    isActive: isActive || conversationState.isInConversation,
    currentStep: conversationState.currentStep,
    waitingForFollowUp: conversationState.isInConversation,
  };

  return (
    <div className="space-y-4">
      <VoiceStatus 
        isActive={isActive}
        isListening={isListening}
        isInConversation={conversationState.isInConversation}
        conversationState={displayConversationState}
      />

      <VoiceControls
        isActive={isActive}
        onActivate={activateConversation}
        onDeactivate={deactivateConversation}
        onCancelConversation={handleCancelConversation}
        isInConversation={conversationState.isInConversation}
      />

      {lastTranscript && (
        <div className="p-3 bg-secondary rounded-lg">
          <p className="text-sm font-medium text-secondary-foreground">Last heard:</p>
          <p className="text-sm text-muted-foreground">"{lastTranscript}"</p>
        </div>
      )}

      <ConversationDisplay conversationState={displayConversationState} />

      {(isActive || conversationState.isInConversation) && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
            🎤 Voice Mode Active
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            {conversationState.isInConversation && conversationState.currentStep
              ? conversationState.currentStep.question || "Tell me what information to add to your entry..."
              : 'Try: "create a new entry", "open [entry name]", "delete [entry name]", "search for [term]", or "help"'
            }
          </p>
        </div>
      )}

      {pendingDeleteEntry && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-500">
          <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
            ⚠️ Confirm Deletion
          </p>
          <p className="text-xs text-yellow-600 dark:text-yellow-400">
            Say "confirm delete" to delete "{pendingDeleteEntry.title}" or "cancel" to abort.
          </p>
        </div>
      )}
    </div>
  );
};