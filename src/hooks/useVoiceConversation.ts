import { useState, useRef } from "react";
import { SavedEntry } from "@/types/dashboard";
import { VoiceCommand, processVoiceCommand } from "@/utils/voiceCommandProcessor";
import { toast } from "sonner";
import { speak } from "@/utils/textToSpeech";

interface ConversationStep {
  type: 'title' | 'category' | 'field_name' | 'field_type' | 'more_fields' | 'confirm';
  question: string;
  expectedResponse?: string[];
}

interface EntryDraft {
  title?: string;
  category?: string;
  fields: { name: string; type: 'text' | 'number' | 'date' | 'textarea' }[];
}

interface VoiceConversationState {
  isActive: boolean;
  currentStep: ConversationStep | null;
  entryDraft: EntryDraft;
  currentFieldName?: string;
}

interface UseVoiceConversationProps {
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
  // Add form field setters to communicate with the form
  formTitleSetter?: (title: string) => void;
  formCategorySetter?: (category: string) => void;
  formAddFieldFunction?: (fieldName?: string, fieldType?: string) => void;
}

const CONVERSATION_STEPS = {
  TITLE: {
    type: 'title' as const,
    question: "What would you like to call this entry?",
  },
  CATEGORY: {
    type: 'category' as const,
    question: "What category should this entry be in?",
    expectedResponse: ['Documents', 'Health', 'Contacts', 'Finance', 'Personal']
  },
  MORE_FIELDS: {
    type: 'more_fields' as const,
    question: "Would you like to add any custom fields? Say yes to add fields, or no to create the entry now.",
    expectedResponse: ['yes', 'no']
  },
  FIELD_NAME: {
    type: 'field_name' as const,
    question: "What would you like to name this field?",
  },
  FIELD_TYPE: {
    type: 'field_type' as const,
    question: "What type of field should this be? You can say text, number, date, or textarea.",
    expectedResponse: ['text', 'number', 'date', 'textarea']
  },
  CONFIRM: {
    type: 'confirm' as const,
    question: "I'll create your entry now. Say confirm to proceed or cancel to start over.",
    expectedResponse: ['confirm', 'cancel']
  }
};

export const useVoiceConversation = ({
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
  formTitleSetter,
  formCategorySetter,
  formAddFieldFunction,
}: UseVoiceConversationProps) => {
  const [conversationState, setConversationState] = useState<VoiceConversationState>({
    isActive: false,
    currentStep: null,
    entryDraft: { fields: [] },
  });

  const startCreateEntryConversation = () => {
    console.log('startCreateEntryConversation called - opening Add Entry form immediately');
    
    // CRITICAL: Open the Add Entry form immediately and synchronously
    setShowAddEntry(true);
    console.log('Set showAddEntry to true immediately');
    
    // Clear any existing editing states to ensure clean form
    setEditingEntry(null);
    setFillingEntry(null);
    console.log('Cleared existing editing states');
    
    // Start conversation state immediately 
    const newState: VoiceConversationState = {
      isActive: true,
      currentStep: CONVERSATION_STEPS.TITLE,
      entryDraft: { fields: [] },
    };
    
    setConversationState(newState);
    console.log('Conversation state set immediately:', newState);
    
    // CRITICAL: Ensure speech recognition keeps listening after form opens
    setTimeout(() => {
      console.log('Speaking first question:', CONVERSATION_STEPS.TITLE.question);
      speak(CONVERSATION_STEPS.TITLE.question);
      toast.info("Voice conversation started - Add Entry form is now open");
      
      // FORCE speech recognition to continue listening after form opens
      setTimeout(() => {
        const isListening = (window as any).__speech_recognition_active;
        console.log('Checking if speech recognition is still listening after form opened:', isListening);
        
        if (!isListening) {
          console.log('Speech recognition stopped after form opened - forcing restart');
          // Trigger a restart by dispatching a custom event
          window.dispatchEvent(new CustomEvent('force-voice-restart', { 
            detail: { reason: 'form_opened', conversationActive: true } 
          }));
        } else {
          console.log('Speech recognition is still active - continuing conversation');
        }
      }, 1000);
    }, 300);
  };

  const processConversationResponse = (transcript: string) => {
    if (!conversationState.isActive || !conversationState.currentStep) {
      console.log('Not in conversation mode, not processing as conversation response');
      return false; // Not in conversation mode
    }

    const lowerTranscript = transcript.toLowerCase().trim();
    const { currentStep, entryDraft } = conversationState;

    console.log('Processing conversation response:', {
      step: currentStep.type,
      transcript: lowerTranscript,
      entryDraft
    });
    
    // Skip processing if this looks like a command to start a new conversation
    if (lowerTranscript.includes('create') && lowerTranscript.includes('entry') && currentStep.type === 'title') {
      console.log('Detected new "create entry" command during title step - treating as entry title');
      // Process it as the title rather than a new command
    }

    switch (currentStep.type) {
      case 'title':
        // Capture the title and update the form immediately
        const newEntryDraft = { ...entryDraft, title: transcript };
        setConversationState({
          ...conversationState,
          currentStep: CONVERSATION_STEPS.CATEGORY,
          entryDraft: newEntryDraft,
        });
        
        // Update the form title field using the proper setter
        if (formTitleSetter) {
          console.log('Setting form title via setter:', transcript);
          formTitleSetter(transcript);
        } else {
          console.log('No form title setter available, using DOM fallback');
          // Fallback to DOM manipulation if setter not available
          setTimeout(() => {
            const titleInput = document.querySelector('#title') as HTMLInputElement;
            if (titleInput) {
              titleInput.value = transcript;
              titleInput.dispatchEvent(new Event('input', { bubbles: true }));
              console.log('Updated title field in form via DOM:', transcript);
            }
          }, 100);
        }
        
        speak(CONVERSATION_STEPS.CATEGORY.question);
        toast.success(`Entry title set: \"${transcript}\"`);
        break;

      case 'category':
        // Match category
        const categories = ['documents', 'health', 'contacts', 'finance', 'personal'];
        const matchedCategory = categories.find(cat => 
          lowerTranscript.includes(cat)
        );
        
        const categoryName = matchedCategory ? 
          matchedCategory.charAt(0).toUpperCase() + matchedCategory.slice(1) : 
          'Personal';
        
        const updatedDraft = { ...entryDraft, category: categoryName };
        setConversationState({
          ...conversationState,
          currentStep: CONVERSATION_STEPS.MORE_FIELDS,
          entryDraft: updatedDraft,
        });
        
        // Update the category field using the proper setter
        if (formCategorySetter) {
          console.log('Setting form category via setter:', categoryName);
          formCategorySetter(categoryName);
        } else {
          console.log('No form category setter available, using DOM fallback');
          // Fallback to DOM manipulation
          setTimeout(() => {
            const categorySelect = document.querySelector('button[role="combobox"]') as HTMLButtonElement;
            if (categorySelect) {
              categorySelect.click();
              setTimeout(() => {
                const categoryOption = Array.from(document.querySelectorAll('[role="option"]'))
                  .find(option => option.textContent?.toLowerCase().includes(categoryName.toLowerCase()));
                if (categoryOption) {
                  (categoryOption as HTMLElement).click();
                  console.log('Updated category field in form via DOM:', categoryName);
                }
              }, 100);
            }
          }, 100);
        }
        
        speak(CONVERSATION_STEPS.MORE_FIELDS.question);
        toast.success(`Category set: ${categoryName}`);
        break;

      case 'more_fields':
        if (lowerTranscript.includes('yes') || lowerTranscript.includes('add')) {
          setConversationState({
            ...conversationState,
            currentStep: CONVERSATION_STEPS.FIELD_NAME,
          });
          speak(CONVERSATION_STEPS.FIELD_NAME.question);
          toast.info("Adding custom field - what should it be called?");
        } else {
          // No more fields, create the entry
          createEntryFromDraft(entryDraft);
        }
        break;

      case 'field_name':
        // Store field name and ask for type
        setConversationState({
          ...conversationState,
          currentStep: CONVERSATION_STEPS.FIELD_TYPE,
          currentFieldName: transcript,
        });
        speak(CONVERSATION_STEPS.FIELD_TYPE.question);
        toast.success(`Field name set: \"${transcript}\"`);
        break;

      case 'field_type':
        // Match field type
        const fieldTypes = ['text', 'number', 'date', 'textarea'];
        const matchedType = fieldTypes.find(type => 
          lowerTranscript.includes(type)
        ) as 'text' | 'number' | 'date' | 'textarea' || 'text';
        
        // Add field to draft
        const newField = {
          name: conversationState.currentFieldName || 'Custom Field',
          type: matchedType
        };
        
        const draftWithField = {
          ...entryDraft,
          fields: [...entryDraft.fields, newField]
        };
        
        setConversationState({
          ...conversationState,
          currentStep: CONVERSATION_STEPS.MORE_FIELDS,
          entryDraft: draftWithField,
          currentFieldName: undefined,
        });
        
        speak(`Added ${matchedType} field \"${newField.name}\". ${CONVERSATION_STEPS.MORE_FIELDS.question}`);
        toast.success(`Added field: ${newField.name} (${matchedType})`);
        break;

      case 'confirm':
        if (lowerTranscript.includes('confirm') || lowerTranscript.includes('yes')) {
          createEntryFromDraft(entryDraft);
        } else {
          cancelConversation();
        }
        break;
    }

    return true; // Handled in conversation mode
  };

  const createEntryFromDraft = (draft: EntryDraft) => {
    const entry = {
      title: draft.title || `New Entry - ${new Date().toLocaleDateString()}`,
      fields: {
        category: draft.category || 'Personal',
        description: '', // Default field
        ...Object.fromEntries(draft.fields.map(field => [field.name, '']))
      },
      fieldDefinitions: [
        { id: 'category', name: 'category', type: 'text' as const },
        { id: 'description', name: 'description', type: 'textarea' as const },
        ...draft.fields.map((field, index) => ({
          id: `field_${Date.now()}_${index}`,
          name: field.name,
          type: field.type
        }))
      ]
    };

    saveEntry(entry);
    
    const successMessage = `Created entry \"${entry.title}\" in ${entry.fields.category} with ${draft.fields.length} custom fields`;
    toast.success(successMessage);
    speak(successMessage);
    
    // Reset conversation state
    setConversationState({
      isActive: false,
      currentStep: null,
      entryDraft: { fields: [] },
    });
  };

  const cancelConversation = () => {
    setConversationState({
      isActive: false,
      currentStep: null,
      entryDraft: { fields: [] },
    });
    speak("Entry creation cancelled. What else can I help you with?");
    toast.info("Voice conversation cancelled");
  };

  const handleOpenFileCommand = (searchTerm: string) => {
    console.log('Processing open file command for:', searchTerm);
    
    // Enhanced search across all entries with fuzzy matching
    const searchResults = savedEntries.filter(entry => {
      const searchLower = searchTerm.toLowerCase();
      const titleMatch = entry.title.toLowerCase().includes(searchLower);
      const fieldMatch = Object.values(entry.fields).some(value => 
        typeof value === 'string' && value.toLowerCase().includes(searchLower)
      );
      return titleMatch || fieldMatch;
    });
    
    if (searchResults.length === 1) {
      // Single match - open it directly
      editEntry(searchResults[0]);
      const openMessage = `Opening: ${searchResults[0].title}`;
      toast.success(openMessage);
      speak(openMessage);
    } else if (searchResults.length > 1) {
      // Multiple matches - show options
      const matches = searchResults.slice(0, 3).map(entry => entry.title).join(', ');
      const multipleMessage = `Found ${searchResults.length} matches: ${matches}. Please be more specific.`;
      toast.info(multipleMessage);
      speak(multipleMessage);
    } else {
      // No matches - suggest alternatives
      const noMatchMessage = `No files found matching "${searchTerm}". Try "show all entries" to see available files.`;
      toast.info(noMatchMessage);
      speak(noMatchMessage);
    }
  };

  const handleSmartDelete = (searchTerm: string) => {
    console.log('Processing smart delete command for:', searchTerm);
    
    // Enhanced search across all entries with fuzzy matching
    const searchResults = savedEntries.filter(entry => {
      const searchLower = searchTerm.toLowerCase();
      const titleMatch = entry.title.toLowerCase().includes(searchLower);
      const fieldMatch = Object.values(entry.fields).some(value => 
        typeof value === 'string' && value.toLowerCase().includes(searchLower)
      );
      return titleMatch || fieldMatch;
    });
    
    if (searchResults.length === 1) {
      // Single match - ask for confirmation before deleting
      const entryToDelete = searchResults[0];
      const confirmMessage = `Are you sure you want to delete "${entryToDelete.title}"? Say "confirm delete" to proceed.`;
      toast.info(confirmMessage);
      speak(confirmMessage);
      
      // Set up a temporary listener for confirmation
      const handleDeleteConfirmation = (event: any) => {
        const text = event.detail?.text?.toLowerCase() || '';
        if (text.includes('confirm') && text.includes('delete')) {
          deleteEntry(entryToDelete.id);
          const deleteMessage = `Deleted: ${entryToDelete.title}`;
          toast.success(deleteMessage);
          speak(deleteMessage);
          window.removeEventListener('voice-delete-confirmation', handleDeleteConfirmation);
        } else if (text.includes('cancel') || text.includes('no')) {
          const cancelMessage = 'Delete cancelled';
          toast.info(cancelMessage);
          speak(cancelMessage);
          window.removeEventListener('voice-delete-confirmation', handleDeleteConfirmation);
        }
      };
      
      window.addEventListener('voice-delete-confirmation', handleDeleteConfirmation);
      
      // Auto-remove listener after 30 seconds
      setTimeout(() => {
        window.removeEventListener('voice-delete-confirmation', handleDeleteConfirmation);
      }, 30000);
      
    } else if (searchResults.length > 1) {
      // Multiple matches - show options
      const matches = searchResults.slice(0, 3).map(entry => entry.title).join(', ');
      const multipleMessage = `Found ${searchResults.length} entries matching "${searchTerm}": ${matches}. Please be more specific about which one to delete.`;
      toast.info(multipleMessage);
      speak(multipleMessage);
    } else {
      // No matches - suggest alternatives
      const noMatchMessage = `No entries found matching "${searchTerm}". Try "show all entries" to see what's available.`;
      toast.info(noMatchMessage);
      speak(noMatchMessage);
    }
  };

  const handleVoiceCommand = (command: VoiceCommand) => {
    console.log('Executing voice command:', command);
    
    switch (command.type) {
      case 'create_entry':
        console.log('Voice command: create_entry received');
        console.log('Current showAddEntry state:', showAddEntry);
        console.log('Command params:', command.params);
        
        // Always start conversation for create_entry commands, ignore any extracted titles
        if (command.params?.entryTitle) {
          console.log('Ignoring extracted title for create_entry command:', command.params.entryTitle);
          console.log('Starting conversation mode instead of fill mode');
          command.params.entryTitle = ''; // Clear any extracted title
        }
        
        // Clear any filling state to ensure we're in create mode
        setFillingEntry(null);
        setEditingEntry(null);
        console.log('Cleared existing states for create mode');
        
        // CRITICAL: Ensure the form opens immediately and visibly
        console.log('About to call setShowAddEntry(true)');
        setShowAddEntry(true);
        console.log('Called setShowAddEntry(true)');
        
        // Start the conversation
        startCreateEntryConversation();
        console.log('startCreateEntryConversation called');
        
        // Add visual feedback
        toast.success('Add Entry form opened - Voice conversation starting...');
        
        break;
        
      case 'confirm_delete':
        // Trigger the custom event for delete confirmation
        window.dispatchEvent(new CustomEvent('voice-delete-confirmation', { 
          detail: { text: 'confirm delete', timestamp: Date.now() } 
        }));
        break;
        
      case 'open_entry':
        if (command.params?.entryTitle === 'all_entries') {
          const allEntriesMessage = 'Showing all entries';
          toast.success(allEntriesMessage);
          speak(allEntriesMessage);
        } else if (command.params?.entryTitle) {
          const entryToOpen = savedEntries.find(entry => 
            entry.title.toLowerCase().includes(command.params?.entryTitle?.toLowerCase() || '')
          );
          if (entryToOpen) {
            editEntry(entryToOpen);
            const openMessage = `Opening entry: ${entryToOpen.title}`;
            toast.success(openMessage);
            speak(openMessage);
          } else {
            const errorMessage = `Entry \"${command.params.entryTitle}\" not found. Showing available entries instead.`;
            toast.info(errorMessage);
            speak(errorMessage);
          }
        }
        break;
        
      case 'open_file':
        handleOpenFileCommand(command.params?.entryTitle || '');
        break;
        
      case 'create_field':
        const fieldName = command.params?.fieldName || 'New Field';
        const fieldType = command.params?.fieldType || 'text';
        
        // Check if form is open and has addField function
        if (formAddFieldFunction) {
          console.log('🎯 Adding field to current form:', { fieldName, fieldType });
          formAddFieldFunction(fieldName, fieldType);
          const addFieldMessage = `Added field "${fieldName}" to the current form`;
          toast.success(addFieldMessage);
          // Removed speak() to prevent interference with voice input
        } else {
          // Fallback: create new entry with the field
          const newEntry = {
            title: `${fieldName} Entry - ${new Date().toLocaleDateString()}`,
            fields: {
              category: 'Personal',
              [fieldName]: ''
            },
            fieldDefinitions: [
              { id: 'category', name: 'category', type: 'text' as const },
              { id: Date.now().toString(), name: fieldName, type: fieldType as 'text' | 'number' | 'date' | 'textarea' }
            ]
          };
          
          saveEntry(newEntry);
          const createFieldMessage = `Created new entry with field "${fieldName}"`;
          toast.success(createFieldMessage);
          // Removed speak() to prevent interference with voice input
        }
        break;
        
      case 'delete_entry':
        if (command.params?.entryTitle) {
          handleSmartDelete(command.params.entryTitle);
        } else {
          const noTargetMessage = 'Please specify what to delete. Try "delete medical records" or "delete invoice".';
          toast.info(noTargetMessage);
          speak(noTargetMessage);
        }
        break;
        
      case 'fill_form':
        if (command.params?.entryTitle) {
          const entryToFill = savedEntries.find(entry => 
            entry.title.toLowerCase().includes(command.params?.entryTitle?.toLowerCase() || '')
          );
          if (entryToFill) {
            fillEntry(entryToFill);
            const fillMessage = `Filling form: ${entryToFill.title}`;
            toast.success(fillMessage);
            speak(fillMessage);
          } else {
            const errorMessage = `Template \"${command.params.entryTitle}\" not found`;
            toast.error(errorMessage);
            speak(errorMessage);
          }
        }
        break;
        
      case 'save_entry':
        if (showAddEntry) {
          const saveMessage = 'Please fill out the form and click save to save the entry';
          toast.success('Voice command: Save the current entry');
          speak(saveMessage);
        } else {
          const noEntryMessage = 'No entry form is currently open';
          toast.info(noEntryMessage);
          speak(noEntryMessage);
        }
        break;
        
      case 'cancel':
        console.log('Close/Cancel command received');
        
        // Comprehensive close functionality
        if (conversationState.isActive) {
          cancelConversation();
          const stopConversationMessage = 'Voice conversation stopped';
          toast.info(stopConversationMessage);
          speak(stopConversationMessage);
        } else if (showAddEntry) {
          handleCancelEdit();
          const closeFormMessage = 'Form closed';
          toast.success(closeFormMessage);
          speak(closeFormMessage);
        } else {
          // General close command - could close any open dialogs/modals
          const generalCloseMessage = 'Closing current view';
          toast.info(generalCloseMessage);
          speak(generalCloseMessage);
          
          // Trigger a custom event that components can listen to for closing
          window.dispatchEvent(new CustomEvent('voice-close-command', { 
            detail: { timestamp: Date.now() } 
          }));
        }
        break;
        
      default:
        const helpMessage = 'Voice command not recognized. Try: CREATE NEW ENTRY, TITLE MY DOCUMENT, ADD FIELD NAME';
        toast.info(helpMessage);
        // Removed speak() to prevent interference with voice input
    }
  };

  const handleVoiceResult = (text: string) => {
    console.log('Processing voice text:', text);
    console.log('Current conversation state:', {
      isActive: conversationState.isActive,
      currentStep: conversationState.currentStep?.type,
      hasEntryDraft: !!conversationState.entryDraft
    });
    
    // First check if we're in conversation mode
    if (conversationState.isActive && conversationState.currentStep) {
      console.log('Voice input handled by conversation system');
      const handled = processConversationResponse(text);
      if (handled) {
        return; // Handled by conversation system
      }
    }
    
    // Otherwise process as a regular command - but NOT if we just started a conversation
    const command = processVoiceCommand(text);
    
    // If this is a "create entry" command and we're about to start a conversation, don't double-process
    if (command.type === 'create_entry' && conversationState.isActive) {
      console.log('Ignoring duplicate create_entry command during active conversation');
      return;
    }
    
    console.log('Processing as regular voice command');
    handleVoiceCommand(command);
  };

  return {
    handleVoiceCommand,
    handleVoiceResult,
    conversationState,
    cancelConversation,
  };
};
