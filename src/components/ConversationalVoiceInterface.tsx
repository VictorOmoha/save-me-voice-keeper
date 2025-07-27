
import React, { useEffect, useState, useRef } from "react";
import { useVoiceFormContext } from "@/contexts/VoiceFormContext";
import { VoiceStatus } from "./voice/VoiceStatus";
import { VoiceControls } from "./voice/VoiceControls";
import { ConversationDisplay } from "./voice/ConversationDisplay";
import { SavedEntry } from "@/types/dashboard";
import { speechRecognition } from "@/utils/speechRecognitionSingleton";
import { toast } from "sonner";
import { speak } from "@/utils/textToSpeech";
import { voiceProcessor, EnhancedVoiceCommand } from "@/utils/enhancedVoiceProcessor";
import { useTTSEventHandler } from "@/hooks/useTTSEventHandler";

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
  const [isInConversation, setIsInConversation] = useState(false);
  const [conversationState, setConversationState] = useState<{ currentStep: any }>({ currentStep: null });
  const [waitingForFollowUp, setWaitingForFollowUp] = useState(false);
  
  // Create a ref to track the recognition instance for TTS event handler
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  // Get form context if available
  const formContext = useVoiceFormContext();

  // Use TTS event handler to restart recognition after TTS completes
  useTTSEventHandler({
    conversationState: { isActive },
    isListening,
    recognitionRef,
    setIsListening,
  });

  // Execute voice commands
  const executeVoiceCommand = async (command: EnhancedVoiceCommand) => {
    console.log('🚀 ConversationalVoiceInterface: Executing command:', command.action, command.parameters);
    
    // Don't execute if it's just feedback
    if (command.action === 'tts_feedback_blocked') {
      console.log('🚫 ConversationalVoiceInterface: Skipping TTS feedback');
      return;
    }
    
    // Set conversation state based on command
    setIsInConversation(true);
    
    switch (command.action) {
      case 'initiate_create':
        console.log('📝 Executing create entry command');
        onCreateEntry();
        setWaitingForFollowUp(true);
        toast.success('Creating new entry - tell me what to add');
        break;
        
      case 'open_entry':
        if (command.parameters.entryId) {
          const entry = savedEntries.find(e => e.id === command.parameters.entryId);
          if (entry) {
            console.log('📂 Opening entry:', entry.title);
            onEditEntry(entry);
            toast.success(`Opening: ${entry.title}`);
          }
        } else if (command.parameters.title) {
          const entry = savedEntries.find(e => 
            e.title.toLowerCase().includes(command.parameters.title.toLowerCase())
          );
          if (entry) {
            console.log('📂 Opening entry by title:', entry.title);
            onEditEntry(entry);
            toast.success(`Opening: ${entry.title}`);
          } else {
            toast.error(`Entry "${command.parameters.title}" not found`);
          }
        }
        break;
        
      case 'delete_entry':
        if (command.parameters.confirmed) {
          if (command.parameters.entryId) {
            const entry = savedEntries.find(e => e.id === command.parameters.entryId);
            if (entry) {
              console.log('🗑️ Deleting entry:', entry.title);
              onDeleteEntry(command.parameters.entryId);
              toast.success(`Deleted: ${entry.title}`);
            }
          }
        }
        break;
        
      case 'execute_search':
        console.log('🔍 Search command:', command.parameters.query);
        toast.info(`Searching for: ${command.parameters.query}`);
        break;
        
      case 'close_entry':
        console.log('🚪 Closing entry view/form');
        // Trigger close events for any open entry dialogs/modals and forms
        window.dispatchEvent(new CustomEvent('close-entry-dialog'));
        window.dispatchEvent(new CustomEvent('close-entry-form'));
        toast.success('Entry closed');
        break;
        
      case 'greeting':
        console.log('👋 Greeting command');
        break;
        
      case 'create_entry_with_content':
        console.log('📝 Creating entry with content');
        const newEntry = {
          title: command.parameters.title || `Voice Entry - ${new Date().toLocaleDateString()}`,
          fields: {
            category: command.parameters.category || 'Personal',
            description: command.parameters.description || '',
            ...command.parameters.additionalFields
          },
          fieldDefinitions: [
            { id: 'category', name: 'category', type: 'text' as const },
            { id: 'description', name: 'Description', type: 'textarea' as const },
          ],
          category: command.parameters.category || 'Personal',
        };
        
        onSaveEntry(newEntry);
        toast.success(`Created: "${newEntry.title}"`);
        setWaitingForFollowUp(false);
        break;
        
      case 'clarify_confirmation':
        console.log('❓ Clarification needed');
        break;
        
      case 'unknown_command':
        console.log('❓ Unknown command:', command.parameters.originalText);
        break;
        
      default:
        console.log('❓ Unhandled command action:', command.action);
    }
  };

  // Process voice input
  const processVoiceInput = async (transcript: string) => {
    console.log('🎙️ ConversationalVoiceInterface: Processing voice input:', transcript);
    
    // Skip very short inputs
    if (transcript.trim().length < 2) {
      console.log('🚫 ConversationalVoiceInterface: Input too short, skipping');
      return;
    }
    
    try {
      // Create context for voice processing
      const context = {
        currentView: 'dashboard',
        availableEntries: savedEntries.map(entry => ({
          id: entry.id,
          title: entry.title,
          category: entry.fields.category || 'Personal'
        })),
        previousCommands: [],
        waitingForFollowUp
      };
      
      // Process the command
      const command = await voiceProcessor.processVoiceCommand(transcript, context);
      console.log('🎯 ConversationalVoiceInterface: Processed command:', command);
      
      // Only execute if it's not TTS feedback
      if (command.action !== 'tts_feedback_blocked') {
        // Execute the command
        await executeVoiceCommand(command);
        
        // Provide conversational response
        if (command.conversationalResponse) {
          console.log('🔊 ConversationalVoiceInterface: Speaking response:', command.conversationalResponse);
          speak(command.conversationalResponse);
        }
      }
      
      // Update conversation state
      if (command.followUpExpected) {
        setWaitingForFollowUp(true);
      }
      
    } catch (error) {
      console.error('❌ ConversationalVoiceInterface: Error processing voice input:', error);
      toast.error('Sorry, I had trouble understanding that command.');
      speak('Sorry, I had trouble understanding that. Could you try again?');
    }
  };

  // Initialize speech recognition
  useEffect(() => {
    console.log('🎤 ConversationalVoiceInterface: Initializing speech recognition');
    
    if (!speechRecognition.isSupported()) {
      console.warn('Speech recognition not supported');
      return;
    }

    speechRecognition.setCallbacks({
      onResult: (transcript: string) => {
        console.log('🎯 ConversationalVoiceInterface: Received transcript:', transcript);
        setLastTranscript(transcript);
        
        // Process the voice input
        processVoiceInput(transcript);
        
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
      speechRecognition.stop();
    };
  }, [savedEntries, waitingForFollowUp]);

  const activateConversation = () => {
    console.log('🚀 ConversationalVoiceInterface: Activating conversation');
    setIsActive(true);
    setIsInConversation(false);
    setWaitingForFollowUp(false);
    
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
    setIsInConversation(false);
    setWaitingForFollowUp(false);
    speechRecognition.stop();
    voiceProcessor.clearPendingConfirmation();
    toast.info('Voice mode deactivated');
  };

  const cancelConversation = () => {
    console.log('❌ ConversationalVoiceInterface: Cancelling conversation');
    setIsActive(false);
    setIsInConversation(false);
    setWaitingForFollowUp(false);
    speechRecognition.stop();
    voiceProcessor.clearPendingConfirmation();
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
    waitingForFollowUp,
  };

  return (
    <div className="space-y-4">
      <VoiceStatus 
        isActive={isActive}
        isListening={isListening}
        isInConversation={isInConversation || waitingForFollowUp}
        conversationState={displayConversationState}
      />

      <VoiceControls
        isActive={isActive}
        onActivate={activateConversation}
        onDeactivate={deactivateConversation}
        onCancelConversation={cancelConversation}
        isInConversation={isInConversation || waitingForFollowUp}
      />

      {lastTranscript && (
        <div className="p-3 bg-secondary rounded-lg">
          <p className="text-sm font-medium text-secondary-foreground">Last heard:</p>
          <p className="text-sm text-muted-foreground">"{lastTranscript}"</p>
        </div>
      )}

      <ConversationDisplay conversationState={displayConversationState} />

      {(isActive || isInConversation || waitingForFollowUp) && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
            🎤 Voice Mode Active
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            {waitingForFollowUp 
              ? "Tell me what information to add to your entry..."
              : 'Try: "create a new entry", "open [entry name]", "delete [entry name]", "search for [term]", or "help"'
            }
          </p>
        </div>
      )}
    </div>
  );
};
