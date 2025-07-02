import { useState, useCallback } from 'react';
import { SavedEntry } from "@/pages/Dashboard";
import { EnhancedVoiceCommand, voiceProcessor, VoiceContext } from "@/utils/enhancedVoiceProcessor";
import { toast } from "sonner";
import { speak } from "@/utils/textToSpeech";

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
    };
  }, [savedEntries, currentView, currentEntry]);

  const executeCommand = useCallback(async (command: EnhancedVoiceCommand) => {
    console.log('Executing enhanced voice command:', command);

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
          // Still show toast but don't speak to prevent feedback loops
          toast.info('Command not recognized - please try a different command');
          console.log('Unknown command, not using TTS to prevent feedback');
          break;
        default:
          toast.info('Command not recognized');
          console.log('Unhandled command type, not using TTS to prevent feedback');
      }
    } catch (error) {
      console.error('Error executing command:', error);
      toast.error('Failed to execute command');
      console.log('Command execution error, not using TTS to prevent feedback');
    }
  }, []);

  const handleCreateCommand = async (command: EnhancedVoiceCommand) => {
    const { parameters } = command;
    
    const newEntry = {
      title: parameters.title || `New Entry - ${new Date().toLocaleDateString()}`,
      fields: {
        category: parameters.category || 'Personal',
        description: parameters.description || '',
        ...parameters.additionalFields || {}
      },
      fieldDefinitions: [
        { id: 'category', name: 'category', type: 'text' as const },
        { id: Date.now().toString(), name: 'description', type: 'textarea' as const }
      ]
    };

    onCreateEntry(newEntry);
    toast.success(`Created: ${newEntry.title}`);
    speak(command.conversationalResponse);
  };

  const handleDeleteCommand = async (command: EnhancedVoiceCommand) => {
    const { parameters } = command;

    if (!parameters.confirmed && command.needsConfirmation) {
      setConversationState('confirming');
      toast.info('Confirmation needed');
      speak(command.conversationalResponse);
      return;
    }

    if (parameters.confirmed === false) {
      toast.info('Delete cancelled');
      speak('Okay, I\'ve cancelled the delete operation.');
      return;
    }

    // Find entries to delete
    const entriesToDelete = savedEntries.filter(entry => {
      if (parameters.entryId) return entry.id === parameters.entryId;
      if (parameters.title) return entry.title.toLowerCase().includes(parameters.title.toLowerCase());
      return false;
    });

    entriesToDelete.forEach(entry => onDeleteEntry(entry.id));
    
    const message = `Deleted ${entriesToDelete.length} entry(ies)`;
    toast.success(message);
    speak(message);
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
      toast.success(`Opening: ${entryToEdit.title}`);
      speak(command.conversationalResponse);
    } else {
      toast.error('Entry not found');
      speak('I couldn\'t find that entry. Could you be more specific?');
    }
  };

  const handleSearchCommand = async (command: EnhancedVoiceCommand) => {
    const { parameters } = command;
    onSearch(parameters.query || parameters.term || '');
    toast.success('Search executed');
    speak(command.conversationalResponse);
  };

  const handleNavigateCommand = async (command: EnhancedVoiceCommand) => {
    const { parameters } = command;
    onNavigate(parameters.view || parameters.destination, parameters);
    toast.success('Navigation completed');
    speak(command.conversationalResponse);
  };

  const handleExportCommand = async (command: EnhancedVoiceCommand) => {
    const { parameters } = command;
    onExport(parameters.format || 'csv', parameters.filter);
    toast.success('Export initiated');
    speak(command.conversationalResponse);
  };

  const handleBulkOperationCommand = async (command: EnhancedVoiceCommand) => {
    const { parameters } = command;
    
    if (!parameters.confirmed && command.needsConfirmation) {
      setConversationState('confirming');
      toast.info('Confirmation needed for bulk operation');
      speak(command.conversationalResponse);
      return;
    }

    if (parameters.confirmed === false) {
      toast.info('Bulk operation cancelled');
      speak('Okay, I\'ve cancelled the bulk operation.');
      return;
    }

    onBulkOperation(parameters.operation, parameters.criteria);
    toast.success('Bulk operation completed');
    speak('Bulk operation completed successfully.');
  };

  const handleFormFillCommand = async (command: EnhancedVoiceCommand) => {
    // This would integrate with form filling logic
    toast.success('Form filling initiated');
    speak(command.conversationalResponse);
  };

  const handleConversationCommand = async (command: EnhancedVoiceCommand) => {
    toast.info('Voice Assistant');
    speak(command.conversationalResponse);
  };

  const processVoiceInput = useCallback(async (transcript: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setConversationState('listening');

    try {
      const context = buildContext();
      const command = await voiceProcessor.processVoiceCommand(transcript, context);
      
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
      speak('Sorry, I had trouble understanding that. Please try again.');
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
    speak('Operation cancelled.');
  }, []);

  return {
    processVoiceInput,
    isProcessing,
    lastCommand,
    conversationState,
    hasPendingConfirmation: voiceProcessor.hasPendingConfirmation(),
    cancelCurrentOperation,
  };
};