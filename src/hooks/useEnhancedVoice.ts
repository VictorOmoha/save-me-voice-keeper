
import { useState, useCallback } from 'react';
import { SavedEntry } from "@/types/dashboard";
import { EnhancedVoiceCommand, voiceProcessor, VoiceContext } from "@/utils/enhancedVoiceProcessor";
import { toast } from "sonner";
import { speak, clearSpeechHistory } from "@/utils/textToSpeech";

interface UseEnhancedVoiceProps {
  savedEntries: SavedEntry[];
  currentView?: string;
  currentEntry?: SavedEntry | null;
  onCreateEntry: (entry: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDeleteEntry: (id: string) => void;
  onEditEntry: (entry: SavedEntry) => void;
  onBulkOperation: (operation: string, criteria: any) => void;
  onNavigate: (view: string, params?: any) => void;
  onSearch: (query: string) => void;
  onExport: (format: string, filter?: any) => void;
}

export const useEnhancedVoice = ({
  savedEntries,
  currentView,
  currentEntry,
  onCreateEntry,
  onDeleteEntry,
  onEditEntry,
  onBulkOperation,
  onNavigate,
  onSearch,
  onExport,
}: UseEnhancedVoiceProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCommand, setLastCommand] = useState<EnhancedVoiceCommand | null>(null);
  const [conversationState, setConversationState] = useState<'listening' | 'confirming' | 'idle'>('idle');

  const buildContext = useCallback((): VoiceContext => {
    return {
      currentView,
      availableEntries: savedEntries.map(entry => ({
        id: entry.id,
        title: entry.title,
        category: entry.fields.category || 'Personal'
      })),
      currentEntry: currentEntry ? {
        id: currentEntry.id,
        title: currentEntry.title
      } : undefined,
      previousCommands: [], // Add empty array initially, enhanced processor will fill this
    };
  }, [savedEntries, currentView, currentEntry]);

  const executeCommand = useCallback(async (command: EnhancedVoiceCommand) => {
    console.log('Executing enhanced voice command:', command);

    // Skip execution if this is blocked TTS feedback
    if (command.action === 'tts_feedback_blocked') {
      console.log('🚫 HOOK: Skipping TTS feedback execution');
      return;
    }

    try {
      switch (command.intent) {
        case 'create':
          await handleCreateCommand(command);
          break;
        case 'delete':
          await handleDeleteCommand(command);
          break;
        case 'edit':
          await handleEditCommand(command);
          break;
        case 'search':
          await handleSearchCommand(command);
          break;
        case 'navigate':
          await handleNavigateCommand(command);
          break;
        case 'export':
          await handleExportCommand(command);
          break;
        case 'bulk_operation':
          await handleBulkOperationCommand(command);
          break;
        case 'form_fill':
          await handleFormFillCommand(command);
          break;
        case 'conversation':
          await handleConversationCommand(command);
          break;
        case 'unknown':
          console.log('Unknown command, providing help response');
          toast.info('I didn\'t understand that command');
          setTimeout(() => speak('I didn\'t understand that command. Try saying "create a new entry" or "show me my documents"'), 500);
          break;
        default:
          console.log('Unhandled command type');
          toast.info('Command not recognized');
      }
    } catch (error) {
      console.error('Error executing command:', error);
      toast.error('Failed to execute command');
      setTimeout(() => speak('Sorry, I encountered an error executing that command'), 500);
    }
  }, []);

  const handleCreateCommand = async (command: EnhancedVoiceCommand) => {
    const { parameters, action } = command;
    
    if (action === 'create_entry_with_content') {
      // Handle follow-up response with content
      const newEntry = {
        title: parameters.title || `New Entry - ${new Date().toLocaleDateString()}`,
        fields: {
          category: parameters.category || 'Personal',
          ...(parameters.description && parameters.description.trim() ? { description: parameters.description } : {}),
          ...parameters.additionalFields || {}
        },
        fieldDefinitions: [
          { id: 'category', name: 'category', type: 'text' as const },
          ...(parameters.description && parameters.description.trim() ? [{ id: Date.now().toString(), name: 'description', type: 'textarea' as const }] : [])
        ]
      };

      onCreateEntry(newEntry);
      
      const successMessage = `Successfully created "${newEntry.title}" with your information`;
      toast.success(successMessage);
      console.log('Speaking create success:', successMessage);
      setTimeout(() => speak(command.conversationalResponse || successMessage), 500);
    } else {
      // Initial create command - expecting follow-up
      const successMessage = command.conversationalResponse || 'What information would you like to add to this entry?';
      toast.info('Voice Assistant');
      console.log('Speaking create prompt:', successMessage);
      
      // Stop any active voice recognition before speaking
      if ((window as any).__stopAllVoiceRecognition) {
        (window as any).__stopAllVoiceRecognition();
      }
      
      setTimeout(() => speak(successMessage), 500);
    }
  };

  const handleDeleteCommand = async (command: EnhancedVoiceCommand) => {
    const { parameters } = command;

    if (!parameters.confirmed && command.needsConfirmation) {
      setConversationState('confirming');
      toast.info('Confirmation needed');
      console.log('Speaking confirmation request:', command.conversationalResponse);
      setTimeout(() => speak(command.conversationalResponse || 'Do you want to proceed with deleting this entry?'), 500);
      return;
    }

    if (parameters.confirmed === false) {
      toast.info('Delete cancelled');
      setTimeout(() => speak('Okay, I\'ve cancelled the delete operation'), 500);
      return;
    }

    // Find entries to delete
    const entriesToDelete = savedEntries.filter(entry => {
      if (parameters.entryId) return entry.id === parameters.entryId;
      if (parameters.title) return entry.title.toLowerCase().includes(parameters.title.toLowerCase());
      return false;
    });

    if (entriesToDelete.length === 0) {
      const notFoundMessage = 'No matching entries found to delete';
      toast.error(notFoundMessage);
      setTimeout(() => speak(notFoundMessage), 500);
      return;
    }

    entriesToDelete.forEach(entry => onDeleteEntry(entry.id));
    
    const message = `Deleted ${entriesToDelete.length} entry${entriesToDelete.length > 1 ? 's' : ''}`;
    toast.success(message);
    setTimeout(() => speak(message), 500);
  };

  const handleEditCommand = async (command: EnhancedVoiceCommand) => {
    const { parameters } = command;
    
    const entryToEdit = savedEntries.find(entry => {
      if (parameters.entryId) return entry.id === parameters.entryId;
      if (parameters.title) return entry.title.toLowerCase().includes(parameters.title.toLowerCase());
      return false;
    });

    if (entryToEdit) {
      onEditEntry(entryToEdit);
      const successMessage = `Opening ${entryToEdit.title} for editing`;
      toast.success(successMessage);
      console.log('Speaking edit success:', successMessage);
      setTimeout(() => speak(command.conversationalResponse || successMessage), 500);
    } else {
      const notFoundMessage = 'Entry not found. Could you be more specific?';
      toast.error('Entry not found');
      setTimeout(() => speak(notFoundMessage), 500);
    }
  };

  const handleSearchCommand = async (command: EnhancedVoiceCommand) => {
    const { parameters } = command;
    const query = parameters.query || parameters.term || '';
    onSearch(query);
    
    const successMessage = `Searching for ${query}`;
    toast.success('Search executed');
    console.log('Speaking search success:', successMessage);
    setTimeout(() => speak(command.conversationalResponse || successMessage), 500);
  };

  const handleNavigateCommand = async (command: EnhancedVoiceCommand) => {
    const { parameters } = command;
    onNavigate(parameters.view || parameters.destination, parameters);
    
    const successMessage = 'Navigation completed';
    toast.success(successMessage);
    console.log('Speaking navigation success:', successMessage);
    setTimeout(() => speak(command.conversationalResponse || successMessage), 500);
  };

  const handleExportCommand = async (command: EnhancedVoiceCommand) => {
    const { parameters } = command;
    onExport(parameters.format || 'csv', parameters.filter);
    
    const successMessage = 'Export has been initiated';
    toast.success('Export initiated');
    console.log('Speaking export success:', successMessage);
    setTimeout(() => speak(command.conversationalResponse || successMessage), 500);
  };

  const handleBulkOperationCommand = async (command: EnhancedVoiceCommand) => {
    const { parameters } = command;
    
    if (!parameters.confirmed && command.needsConfirmation) {
      setConversationState('confirming');
      toast.info('Confirmation needed for bulk operation');
      console.log('Speaking bulk confirmation request:', command.conversationalResponse);
      setTimeout(() => speak(command.conversationalResponse || 'Do you want to proceed with this bulk operation?'), 500);
      return;
    }

    if (parameters.confirmed === false) {
      toast.info('Bulk operation cancelled');
      setTimeout(() => speak('Okay, I\'ve cancelled the bulk operation'), 500);
      return;
    }

    onBulkOperation(parameters.operation, parameters.criteria);
    const successMessage = 'Bulk operation completed successfully';
    toast.success('Bulk operation completed');
    setTimeout(() => speak(successMessage), 500);
  };

  const handleFormFillCommand = async (command: EnhancedVoiceCommand) => {
    const successMessage = 'Form filling has been initiated';
    toast.success('Form filling initiated');
    console.log('Speaking form fill success:', successMessage);
    setTimeout(() => speak(command.conversationalResponse || successMessage), 500);
  };

  const handleConversationCommand = async (command: EnhancedVoiceCommand) => {
    toast.info('Voice Assistant');
    console.log('Speaking conversation response:', command.conversationalResponse);
    setTimeout(() => speak(command.conversationalResponse || 'Hello! How can I help you today?'), 500);
  };

  const processVoiceInput = useCallback(async (transcript: string) => {
    if (isProcessing) {
      console.log('Already processing voice input, ignoring new input');
      return;
    }
    
    console.log('Processing voice input:', transcript);
    setIsProcessing(true);
    setConversationState('listening');

    // Clear previous speech history to prevent loops
    clearSpeechHistory();

    try {
      const context = buildContext();
      const command = await voiceProcessor.processVoiceCommand(transcript, context);
      
      console.log('Received processed command:', command);
      setLastCommand(command);
      
      if (command.needsConfirmation) {
        setConversationState('confirming');
      } else {
        setConversationState('idle');
      }

      await executeCommand(command);
      
    } catch (error) {
      console.error('Error processing voice input:', error);
      toast.error('Failed to process voice command');
      setTimeout(() => speak('Sorry, I had trouble processing that command. Please try again.'), 500);
    } finally {
      setIsProcessing(false);
      if (conversationState !== 'confirming') {
        setConversationState('idle');
      }
    }
  }, [buildContext, executeCommand, isProcessing, conversationState]);

  const cancelCurrentOperation = useCallback(() => {
    voiceProcessor.clearPendingConfirmation();
    setConversationState('idle');
    setLastCommand(null);
    toast.info('Operation cancelled');
    setTimeout(() => speak('Operation cancelled'), 500);
  }, []);

  return {
    processVoiceInput,
    isProcessing,
    lastCommand,
    conversationState,
    hasPendingConfirmation: voiceProcessor.hasPendingConfirmation(),
    isExpectingFollowUp: voiceProcessor.isExpectingFollowUp(),
    cancelCurrentOperation,
  };
};
