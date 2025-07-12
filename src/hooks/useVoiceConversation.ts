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
    question: "What category should this entry be in? You can say Documents, Health, Contacts, Finance, or Personal.",
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
        
      case 'create_field':
        const fieldName = command.params?.fieldName || 'New Field';
        const fieldType = command.params?.fieldType || 'text';
        
        // Check if form is open and has addField function
        if (formAddFieldFunction) {
          console.log('🎯 Adding field to current form:', { fieldName, fieldType });
          formAddFieldFunction(fieldName, fieldType);
          const addFieldMessage = `Added field "${fieldName}" to the current form`;
          toast.success(addFieldMessage);
          speak(addFieldMessage);
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
          speak(createFieldMessage);
        }
        break;
        
      case 'delete_entry':
        if (command.params?.entryTitle) {
          const entryToDelete = savedEntries.find(entry => 
            entry.title.toLowerCase().includes(command.params?.entryTitle?.toLowerCase() || '')
          );
          if (entryToDelete) {
            deleteEntry(entryToDelete.id);
            const deleteMessage = `Deleted entry: ${entryToDelete.title}`;
            toast.success(deleteMessage);
            speak(deleteMessage);
          } else {
            const errorMessage = `Entry \"${command.params.entryTitle}\" not found`;
            toast.error(errorMessage);
            speak(errorMessage);
          }
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
        if (conversationState.isActive) {
          cancelConversation();
        } else if (showAddEntry) {
          handleCancelEdit();
          const cancelMessage = 'Cancelled current action';
          toast.success('Voice command: Cancelled current action');
          speak(cancelMessage);
        } else {
          const noCancelMessage = 'No action to cancel';
          toast.info(noCancelMessage);
          speak(noCancelMessage);
        }
        break;
        
      default:
        const helpMessage = 'I can help you with commands like: Create new entry, Show all entries, Delete entry, or Fill form. Try saying \"create a new entry\" or \"show all my documents\".';
        toast.info('Voice command not recognized');
        speak(helpMessage);
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
