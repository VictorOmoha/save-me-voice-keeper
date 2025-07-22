import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { speak } from '@/utils/textToSpeech';
import { SavedEntry } from '@/types/dashboard';
import { voiceProcessor, EnhancedVoiceCommand } from '@/utils/enhancedVoiceProcessor';

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

interface UnifiedVoiceState {
  isInConversation: boolean;
  currentStep: ConversationStep | null;
  entryDraft: EntryDraft;
  currentFieldName?: string;
}

interface UseUnifiedVoiceProcessorProps {
  savedEntries: SavedEntry[];
  onCreateEntry: () => void;
  onEditEntry: (entry: SavedEntry) => void;
  onDeleteEntry: (id: string) => void;
  onSaveEntry: (entry: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancelEdit: () => void;
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
};

export const useUnifiedVoiceProcessor = ({
  savedEntries,
  onCreateEntry,
  onEditEntry,
  onDeleteEntry,
  onSaveEntry,
  onCancelEdit,
  formTitleSetter,
  formCategorySetter,
  formAddFieldFunction,
}: UseUnifiedVoiceProcessorProps) => {
  const [conversationState, setConversationState] = useState<UnifiedVoiceState>({
    isInConversation: false,
    currentStep: null,
    entryDraft: { fields: [] },
  });

  const pendingDeleteEntry = useRef<SavedEntry | null>(null);

  const startCreateEntryConversation = useCallback(() => {
    console.log('🎯 Starting create entry conversation');
    
    // Open the form immediately
    onCreateEntry();
    
    // Start conversation
    setConversationState({
      isInConversation: true,
      currentStep: CONVERSATION_STEPS.TITLE,
      entryDraft: { fields: [] },
    });
    
    // Ask the first question
    setTimeout(() => {
      speak(CONVERSATION_STEPS.TITLE.question);
      toast.info("🎤 Let's create your entry! " + CONVERSATION_STEPS.TITLE.question);
    }, 500);
  }, [onCreateEntry]);

  const processConversationStep = useCallback((transcript: string) => {
    if (!conversationState.isInConversation || !conversationState.currentStep) {
      return false;
    }

    const lowerTranscript = transcript.toLowerCase().trim();
    const { currentStep, entryDraft } = conversationState;

    console.log('📝 Processing conversation step:', currentStep.type, 'with input:', transcript);

    switch (currentStep.type) {
      case 'title':
        const title = transcript.trim();
        const newEntryDraft = { ...entryDraft, title };
        
        setConversationState({
          ...conversationState,
          currentStep: CONVERSATION_STEPS.CATEGORY,
          entryDraft: newEntryDraft,
        });
        
        // Update form immediately
        if (formTitleSetter) {
          formTitleSetter(title);
        }
        
        speak(CONVERSATION_STEPS.CATEGORY.question);
        toast.success(`✅ Title set: "${title}"`);
        break;

      case 'category':
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
        
        if (formCategorySetter) {
          formCategorySetter(categoryName);
        }
        
        speak(CONVERSATION_STEPS.MORE_FIELDS.question);
        toast.success(`✅ Category set: ${categoryName}`);
        break;

      case 'more_fields':
        if (lowerTranscript.includes('yes') || lowerTranscript.includes('add')) {
          setConversationState({
            ...conversationState,
            currentStep: CONVERSATION_STEPS.FIELD_NAME,
          });
          speak(CONVERSATION_STEPS.FIELD_NAME.question);
          toast.info("📝 Adding custom field - what should it be called?");
        } else {
          // Create the entry
          createEntryFromDraft(entryDraft);
        }
        break;

      case 'field_name':
        setConversationState({
          ...conversationState,
          currentStep: CONVERSATION_STEPS.FIELD_TYPE,
          currentFieldName: transcript.trim(),
        });
        speak(CONVERSATION_STEPS.FIELD_TYPE.question);
        toast.success(`📝 Field name set: "${transcript.trim()}"`);
        break;

      case 'field_type':
        const fieldTypes = ['text', 'number', 'date', 'textarea'];
        const matchedType = fieldTypes.find(type => 
          lowerTranscript.includes(type)
        ) as 'text' | 'number' | 'date' | 'textarea' || 'text';
        
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
        
        // Add field to form
        if (formAddFieldFunction) {
          formAddFieldFunction(newField.name, matchedType);
        }
        
        speak(`Added ${matchedType} field "${newField.name}". ${CONVERSATION_STEPS.MORE_FIELDS.question}`);
        toast.success(`✅ Added field: ${newField.name} (${matchedType})`);
        break;
    }

    return true;
  }, [conversationState, formTitleSetter, formCategorySetter, formAddFieldFunction]);

  const createEntryFromDraft = useCallback((draft: EntryDraft) => {
    const entry = {
      title: draft.title || `New Entry - ${new Date().toLocaleDateString()}`,
      fields: {
        category: draft.category || 'Personal',
        description: '',
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

    onSaveEntry(entry);
    
    const successMessage = `🎉 Created entry "${entry.title}" in ${entry.fields.category}${draft.fields.length > 0 ? ` with ${draft.fields.length} custom fields` : ''}`;
    toast.success(successMessage);
    speak(successMessage);
    
    // Reset conversation
    setConversationState({
      isInConversation: false,
      currentStep: null,
      entryDraft: { fields: [] },
    });
  }, [onSaveEntry]);

  const processVoiceInput = useCallback(async (transcript: string) => {
    console.log('🎙️ Processing voice input:', transcript);
    
    // First check if we're in a conversation
    if (conversationState.isInConversation) {
      const handled = processConversationStep(transcript);
      if (handled) {
        return;
      }
    }
    
    // Otherwise, process as a command using the enhanced processor
    try {
      const context = {
        currentView: 'dashboard',
        availableEntries: savedEntries.map(entry => ({
          id: entry.id,
          title: entry.title,
          category: entry.fields.category || 'Personal'
        })),
        previousCommands: []
      };
      
      const command: EnhancedVoiceCommand = await voiceProcessor.processVoiceCommand(transcript, context);
      
      console.log('🎯 Processed command:', command);
      
      switch (command.action) {
        case 'create_entry':
          startCreateEntryConversation();
          break;
          
        case 'open_entry':
          if (command.parameters.entryTitle) {
            const entry = savedEntries.find(e => 
              e.title.toLowerCase().includes(command.parameters.entryTitle.toLowerCase())
            );
            if (entry) {
              onEditEntry(entry);
              speak(`Opening ${entry.title}`);
              toast.success(`📂 Opening: ${entry.title}`);
            } else {
              speak(`Entry "${command.parameters.entryTitle}" not found`);
              toast.error(`❌ Entry "${command.parameters.entryTitle}" not found`);
            }
          }
          break;
          
        case 'delete_entry':
          if (command.parameters.entryTitle) {
            const entry = savedEntries.find(e => 
              e.title.toLowerCase().includes(command.parameters.entryTitle.toLowerCase())
            );
            if (entry) {
              pendingDeleteEntry.current = entry;
              speak(`Are you sure you want to delete "${entry.title}"? Say "confirm delete" to proceed.`);
              toast.info(`🗑️ Confirm deletion: "${entry.title}" - Say "confirm delete"`);
            }
          }
          break;
          
        case 'cancel_operation':
          if (conversationState.isInConversation) {
            setConversationState({
              isInConversation: false,
              currentStep: null,
              entryDraft: { fields: [] },
            });
            speak("Conversation cancelled. What else can I help you with?");
            toast.info("❌ Voice conversation cancelled");
          } else {
            onCancelEdit();
            speak("Operation cancelled");
            toast.info("❌ Operation cancelled");
          }
          break;
          
        default:
          if (command.conversationalResponse) {
            speak(command.conversationalResponse);
            toast.info(command.conversationalResponse);
          }
      }
      
      // Handle delete confirmation
      if (transcript.toLowerCase().includes('confirm delete') && pendingDeleteEntry.current) {
        const entry = pendingDeleteEntry.current;
        onDeleteEntry(entry.id);
        speak(`Deleted "${entry.title}"`);
        toast.success(`🗑️ Deleted: ${entry.title}`);
        pendingDeleteEntry.current = null;
      }
      
    } catch (error) {
      console.error('Voice processing error:', error);
      speak("Sorry, I had trouble understanding that. Please try again.");
      toast.error("❌ Voice processing error");
    }
  }, [conversationState, savedEntries, startCreateEntryConversation, processConversationStep, onEditEntry, onDeleteEntry, onCancelEdit]);

  const cancelConversation = useCallback(() => {
    setConversationState({
      isInConversation: false,
      currentStep: null,
      entryDraft: { fields: [] },
    });
    speak("Conversation cancelled. What else can I help you with?");
    toast.info("❌ Voice conversation cancelled");
  }, []);

  return {
    processVoiceInput,
    conversationState,
    cancelConversation,
    isInConversation: conversationState.isInConversation,
  };
};
