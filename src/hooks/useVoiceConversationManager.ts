import React, { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { speak } from '@/utils/textToSpeech';
import { SavedEntry } from '@/types/dashboard';
import { matchCategory } from '@/utils/categoryMatcher';
import { normalizeToDbFieldName } from '@/utils/fieldNameNormalizer';

interface ConversationStep {
  type: 'title' | 'category' | 'field_name' | 'field_type' | 'more_fields' | 'preview' | 'confirm';
  question: string;
  expectedResponse?: string[];
}

interface EntryDraft {
  title?: string;
  category?: string;
  fields: { name: string; type: 'text' | 'number' | 'date' | 'textarea' }[];
}

interface VoiceConversationState {
  isInConversation: boolean;
  currentStep: ConversationStep | null;
  entryDraft: EntryDraft;
  currentFieldName?: string;
}

interface UseVoiceConversationManagerProps {
  onCreateEntry: () => void;
  onSaveEntry: (entry: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
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
  PREVIEW: {
    type: 'preview' as const,
    question: "Here's your entry preview. Would you like to save this entry or edit something?",
  },
};

export const useVoiceConversationManager = ({
  onCreateEntry,
  onSaveEntry,
  formTitleSetter,
  formCategorySetter,
  formAddFieldFunction,
}: UseVoiceConversationManagerProps) => {
  const [conversationState, setConversationState] = useState<VoiceConversationState>({
    isInConversation: false,
    currentStep: null,
    entryDraft: { fields: [] },
  });

  const conversationStateRef = useRef<VoiceConversationState>(conversationState);
  conversationStateRef.current = conversationState;

  const startCreateEntryConversation = useCallback(() => {
    onCreateEntry();

    const newState = {
      isInConversation: true,
      currentStep: CONVERSATION_STEPS.TITLE,
      entryDraft: { fields: [] },
    };

    // Update ref immediately to avoid stale closure issues
    conversationStateRef.current = newState;
    setConversationState(newState);

    console.log('🎤 Voice Conversation: Started conversation, state set:', {
      isInConversation: conversationStateRef.current.isInConversation,
      currentStep: conversationStateRef.current.currentStep?.type
    });

    setTimeout(() => {
      speak(CONVERSATION_STEPS.TITLE.question);
      toast.info("🎤 " + CONVERSATION_STEPS.TITLE.question);
    }, 500);
  }, [onCreateEntry]);

  const endConversation = useCallback(() => {
    const newState = {
      isInConversation: false,
      currentStep: null,
      entryDraft: { fields: [] },
    };
    // Update ref immediately
    conversationStateRef.current = newState;
    setConversationState(newState);
    console.log('🎤 Voice Conversation: Ended conversation');
  }, []);

// Category matching handled by shared utility in utils/categoryMatcher
  const processConversationStep = useCallback((transcript: string) => {
    const currentState = conversationStateRef.current;
    
    if (!currentState.isInConversation || !currentState.currentStep) {
      return false;
    }

    const { currentStep, entryDraft } = currentState;
    const cleanedText = transcript.trim();
    const lowerTranscript = cleanedText.toLowerCase();
    
    if (!cleanedText || cleanedText.length < 1) {
      return false;
    }

    switch (currentStep.type) {
      case 'title': {
        if (cleanedText.length < 2) return false;

        const newEntryDraft = { ...entryDraft, title: cleanedText };
        const titleState = {
          ...currentState,
          currentStep: CONVERSATION_STEPS.CATEGORY,
          entryDraft: newEntryDraft,
        };
        // Update ref immediately
        conversationStateRef.current = titleState;
        setConversationState(titleState);

        console.log('🎤 Voice Conversation: Title set to:', cleanedText);
        formTitleSetter?.(cleanedText);

        setTimeout(() => {
          speak(CONVERSATION_STEPS.CATEGORY.question);
          toast.success(`✅ Title set: "${cleanedText}"`);
        }, 300);
        break;
      }

      case 'category': {
        const matchedCategory = matchCategory(cleanedText);

        if (!matchedCategory) {
          setTimeout(() => {
            speak(`Please say one of: Documents, Health, Contacts, Finance, or Personal.`);
            toast.info(`Please choose a valid category`);
          }, 300);
          return false;
        }

        const updatedDraft = { ...entryDraft, category: matchedCategory };
        const categoryState = {
          ...currentState,
          currentStep: CONVERSATION_STEPS.MORE_FIELDS,
          entryDraft: updatedDraft,
        };
        // Update ref immediately
        conversationStateRef.current = categoryState;
        setConversationState(categoryState);

        console.log('🎤 Voice Conversation: Category set to:', matchedCategory);
        formCategorySetter?.(matchedCategory);

        setTimeout(() => {
          speak(CONVERSATION_STEPS.MORE_FIELDS.question);
          toast.success(`✅ Category set: ${matchedCategory}`);
        }, 300);
        break;
      }

      case 'more_fields': {
        if (lowerTranscript.includes('yes') || lowerTranscript.includes('add')) {
          const addFieldState = {
            ...currentState,
            currentStep: CONVERSATION_STEPS.FIELD_NAME,
          };
          // Update ref immediately
          conversationStateRef.current = addFieldState;
          setConversationState(addFieldState);
          console.log('🎤 Voice Conversation: Adding custom field');
          setTimeout(() => {
            speak(CONVERSATION_STEPS.FIELD_NAME.question);
            toast.info("📝 Adding custom field");
          }, 300);
        } else {
          // Save entry with normalized field names and consistent shape
          const normalizedFields = Object.fromEntries(
            entryDraft.fields.map(field => [normalizeToDbFieldName(field.name), ''])
          );

          const finalEntry = {
            title: entryDraft.title || 'Untitled',
            fields: {
              category: entryDraft.category || 'Personal',
              
              ...normalizedFields,
            },
            fieldDefinitions: [
              { id: 'category', name: 'category', type: 'text' as const },
              
              ...entryDraft.fields.map((field, index) => ({
                id: `field_${Date.now()}_${index}`,
                name: normalizeToDbFieldName(field.name),
                type: field.type,
              })),
            ],
          };

          console.debug('🧪 useVoiceConversationManager finalEntry', finalEntry);
          
          onSaveEntry(finalEntry);
          endConversation();
          
          setTimeout(() => {
            speak("Entry created successfully!");
            toast.success("✅ Entry created!");
          }, 300);
        }
        break;
      }

      case 'field_name': {
        const fieldNameState = {
          ...currentState,
          currentStep: CONVERSATION_STEPS.FIELD_TYPE,
          currentFieldName: cleanedText,
        };
        // Update ref immediately
        conversationStateRef.current = fieldNameState;
        setConversationState(fieldNameState);
        console.log('🎤 Voice Conversation: Field name set to:', cleanedText);
        setTimeout(() => {
          speak(CONVERSATION_STEPS.FIELD_TYPE.question);
          toast.success(`📝 Field name: "${cleanedText}"`);
        }, 300);
        break;
      }

      case 'field_type': {
        const fieldTypes = ['text', 'number', 'date', 'textarea'];
        const matchedType = fieldTypes.find(type =>
          lowerTranscript.includes(type)
        ) as 'text' | 'number' | 'date' | 'textarea' || 'text';

        const currentName = (currentState.currentFieldName ?? '').trim();
        const newField = {
          name: currentName.length ? currentName : 'Custom Field',
          type: matchedType
        };

        const draftWithField = {
          ...entryDraft,
          fields: [...entryDraft.fields, newField]
        };

        const fieldTypeState = {
          ...currentState,
          currentStep: CONVERSATION_STEPS.MORE_FIELDS,
          entryDraft: draftWithField,
          currentFieldName: undefined,
        };
        // Update ref immediately
        conversationStateRef.current = fieldTypeState;
        setConversationState(fieldTypeState);

        console.log('🎤 Voice Conversation: Field type set to:', matchedType);
        formAddFieldFunction?.(newField.name, matchedType);

        setTimeout(() => {
          speak(`Added ${matchedType} field "${newField.name}". ${CONVERSATION_STEPS.MORE_FIELDS.question}`);
          toast.success(`✅ Added field: ${newField.name}`);
        }, 300);
        break;
      }
    }

    return true;
  }, [formTitleSetter, formCategorySetter, formAddFieldFunction, onSaveEntry, endConversation]);
  // Expose a getter for the current state ref to avoid stale closures
  const getConversationState = useCallback(() => {
    return conversationStateRef.current;
  }, []);

  return {
    conversationState,
    startCreateEntryConversation,
    endConversation,
    processConversationStep,
    getConversationState,
  };
};