/**
 * useConversation Hook
 * Manages conversation state for guided entry creation
 */

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { speak } from '@/utils/textToSpeech';
import { ConversationState, EntryDraft, FieldType } from '../types';
import { CONVERSATION_STEPS, VALID_CATEGORIES } from '../constants';
import { intentDetector } from '../core/IntentDetector';
import { cleanVoiceInput, TTS_FEEDBACK_MARKER } from '../core/TextCleaner';
import { voiceProcessor } from '../processors/VoiceProcessor';
import { normalizeToDbFieldName } from '@/utils/fieldNameNormalizer';

interface UseConversationProps {
  onCreateEntry: () => void;
  onSaveEntry: (entry: {
    title: string;
    fields: Record<string, any>;
    fieldDefinitions: Array<{ id: string; name: string; type: string }>;
  }) => void;
  formTitleSetter?: (title: string) => void;
  formCategorySetter?: (category: string) => void;
  formAddFieldFunction?: (fieldName?: string, fieldType?: string) => void;
}

const INITIAL_STATE: ConversationState = {
  isInConversation: false,
  currentStep: null,
  entryDraft: { fields: [] },
};

export function useConversation({
  onCreateEntry,
  onSaveEntry,
  formTitleSetter,
  formCategorySetter,
  formAddFieldFunction,
}: UseConversationProps) {
  const [conversationState, setConversationState] = useState<ConversationState>(INITIAL_STATE);
  const stateRef = useRef<ConversationState>(conversationState);

  // Keep ref in sync with state
  stateRef.current = conversationState;

  /**
   * Start a new conversation for creating an entry
   */
  const startConversation = useCallback(() => {
    console.log('🎯 useConversation: Starting conversation');

    // Open the form immediately
    onCreateEntry();

    // Start conversation
    const newState: ConversationState = {
      isInConversation: true,
      currentStep: CONVERSATION_STEPS.TITLE,
      entryDraft: { fields: [] },
    };

    stateRef.current = newState;
    setConversationState(newState);

    // Ask the first question
    setTimeout(() => {
      voiceProcessor.setLastTTSPrompt(CONVERSATION_STEPS.TITLE.question);
      speak(CONVERSATION_STEPS.TITLE.question);
      toast.info("🎤 Let's create your entry! " + CONVERSATION_STEPS.TITLE.question);
    }, 500);
  }, [onCreateEntry]);

  /**
   * End the current conversation
   */
  const endConversation = useCallback(() => {
    console.log('🎯 useConversation: Ending conversation');
    const newState = INITIAL_STATE;
    stateRef.current = newState;
    setConversationState(newState);
  }, []);

  /**
   * Process a conversation step
   */
  const processStep = useCallback(
    (transcript: string): boolean => {
      const currentState = stateRef.current;

      if (!currentState.isInConversation || !currentState.currentStep) {
        return false;
      }

      const { currentStep, entryDraft } = currentState;

      // Check for TTS feedback
      const originalLower = transcript.toLowerCase().trim();
      const isTTSFeedback =
        originalLower.includes('what type of field should this be') ||
        originalLower.includes('you can say text') ||
        (originalLower.includes('number') && originalLower.includes('date')) ||
        originalLower.includes('what would you like to call') ||
        originalLower.includes('what category should') ||
        originalLower.includes('perfect entry preview') ||
        originalLower.includes('voice mode activated') ||
        originalLower.includes('how can i help you');

      if (isTTSFeedback) {
        console.log('🎤 useConversation: Detected TTS feedback, ignoring');
        return false;
      }

      // Clean the input
      const cleanedText = cleanVoiceInput(transcript);
      const lowerTranscript = cleanedText.toLowerCase().trim();

      console.log('📝 useConversation: Processing step:', currentStep.type, 'with:', cleanedText);

      // Handle special TTS feedback marker
      if (cleanedText === TTS_FEEDBACK_MARKER || !cleanedText || cleanedText.length < 1) {
        askForClarification(currentStep.question);
        return false;
      }

      switch (currentStep.type) {
        case 'title':
          return handleTitleStep(cleanedText, entryDraft);

        case 'category':
          return handleCategoryStep(cleanedText, entryDraft);

        case 'more_fields':
          return handleMoreFieldsStep(lowerTranscript, entryDraft);

        case 'field_name':
          return handleFieldNameStep(cleanedText);

        case 'field_type':
          return handleFieldTypeStep(lowerTranscript, entryDraft, currentState.currentFieldName);

        case 'preview':
          return handlePreviewStep(lowerTranscript, entryDraft);

        default:
          return false;
      }
    },
    [formTitleSetter, formCategorySetter, formAddFieldFunction, onSaveEntry]
  );

  /**
   * Handle title step
   */
  const handleTitleStep = useCallback(
    (cleanedText: string, entryDraft: EntryDraft): boolean => {
      if (cleanedText.length < 2) {
        askForClarification('Please say the title more clearly.');
        return false;
      }

      const newEntryDraft = { ...entryDraft, title: cleanedText };

      updateState({
        currentStep: CONVERSATION_STEPS.CATEGORY,
        entryDraft: newEntryDraft,
      });

      // Update form
      formTitleSetter?.(cleanedText);

      // Dispatch event for live feedback
      window.dispatchEvent(
        new CustomEvent('voice-data-update', {
          detail: { type: 'title', value: cleanedText },
        })
      );

      setTimeout(() => {
        voiceProcessor.setLastTTSPrompt(CONVERSATION_STEPS.CATEGORY.question);
        speak(CONVERSATION_STEPS.CATEGORY.question);
        toast.success(`✅ Title set: "${cleanedText}"`);
      }, 300);

      return true;
    },
    [formTitleSetter]
  );

  /**
   * Handle category step
   */
  const handleCategoryStep = useCallback(
    (cleanedText: string, entryDraft: EntryDraft): boolean => {
      const matchedCategory = intentDetector.matchCategory(cleanedText);

      if (!matchedCategory) {
        askForClarification(
          `I heard "${cleanedText}" - please say one of: Documents, Health, Contacts, Finance, or Personal.`
        );
        return false;
      }

      const updatedDraft = { ...entryDraft, category: matchedCategory };

      updateState({
        currentStep: CONVERSATION_STEPS.MORE_FIELDS,
        entryDraft: updatedDraft,
      });

      formCategorySetter?.(matchedCategory);

      // Dispatch event for live feedback
      window.dispatchEvent(
        new CustomEvent('voice-data-update', {
          detail: { type: 'category', value: matchedCategory },
        })
      );

      setTimeout(() => {
        voiceProcessor.setLastTTSPrompt(CONVERSATION_STEPS.MORE_FIELDS.question);
        speak(CONVERSATION_STEPS.MORE_FIELDS.question);
        toast.success(`✅ Category set: ${matchedCategory}`);
      }, 300);

      return true;
    },
    [formCategorySetter]
  );

  /**
   * Handle more fields step
   */
  const handleMoreFieldsStep = useCallback(
    (lowerTranscript: string, entryDraft: EntryDraft): boolean => {
      if (lowerTranscript.includes('yes') || lowerTranscript.includes('add')) {
        updateState({
          currentStep: CONVERSATION_STEPS.FIELD_NAME,
        });

        setTimeout(() => {
          voiceProcessor.setLastTTSPrompt(CONVERSATION_STEPS.FIELD_NAME.question);
          speak(CONVERSATION_STEPS.FIELD_NAME.question);
          toast.info('📝 Adding custom field - what should it be called?');
        }, 300);
      } else {
        // Move to preview
        updateState({
          currentStep: CONVERSATION_STEPS.PREVIEW,
        });

        setTimeout(() => {
          speak(CONVERSATION_STEPS.PREVIEW.question);
          toast.info('📋 Showing entry preview');
        }, 300);
      }

      return true;
    },
    []
  );

  /**
   * Handle field name step
   */
  const handleFieldNameStep = useCallback((cleanedText: string): boolean => {
    updateState({
      currentStep: CONVERSATION_STEPS.FIELD_TYPE,
      currentFieldName: cleanedText,
    });

    setTimeout(() => {
      voiceProcessor.setLastTTSPrompt(CONVERSATION_STEPS.FIELD_TYPE.question);
      speak(CONVERSATION_STEPS.FIELD_TYPE.question);
      toast.success(`📝 Field name set: "${cleanedText}"`);
    }, 300);

    return true;
  }, []);

  /**
   * Handle field type step
   */
  const handleFieldTypeStep = useCallback(
    (lowerTranscript: string, entryDraft: EntryDraft, currentFieldName?: string): boolean => {
      const fieldTypes: FieldType[] = ['text', 'number', 'date', 'textarea'];
      const matchedType =
        (fieldTypes.find(type => lowerTranscript.includes(type)) as FieldType) || 'text';

      const fieldName = (currentFieldName ?? '').trim() || 'Custom Field';
      const newField = { name: fieldName, type: matchedType };

      const draftWithField = {
        ...entryDraft,
        fields: [...entryDraft.fields, newField],
      };

      updateState({
        currentStep: CONVERSATION_STEPS.MORE_FIELDS,
        entryDraft: draftWithField,
        currentFieldName: undefined,
      });

      // Add field to form
      formAddFieldFunction?.(fieldName, matchedType);

      setTimeout(() => {
        voiceProcessor.setLastTTSPrompt(CONVERSATION_STEPS.MORE_FIELDS.question);
        speak(`Added ${matchedType} field "${fieldName}". ${CONVERSATION_STEPS.MORE_FIELDS.question}`);
        toast.success(`✅ Added field: ${fieldName} (${matchedType})`);
      }, 300);

      return true;
    },
    [formAddFieldFunction]
  );

  /**
   * Handle preview step
   */
  const handlePreviewStep = useCallback(
    (lowerTranscript: string, entryDraft: EntryDraft): boolean => {
      // Check for custom fields request
      if (
        lowerTranscript.includes('add custom') ||
        lowerTranscript.includes('custom field') ||
        lowerTranscript.includes('add field') ||
        lowerTranscript.includes('more field')
      ) {
        updateState({
          currentStep: CONVERSATION_STEPS.FIELD_NAME,
        });

        setTimeout(() => {
          voiceProcessor.setLastTTSPrompt(CONVERSATION_STEPS.FIELD_NAME.question);
          speak(CONVERSATION_STEPS.FIELD_NAME.question);
          toast.info('📝 Adding custom field - what should it be called?');
        }, 300);

        return true;
      }

      // Save entry
      if (
        lowerTranscript.includes('save') ||
        lowerTranscript.includes('yes') ||
        lowerTranscript.includes('looks good') ||
        lowerTranscript.includes('create')
      ) {
        createEntryFromDraft(entryDraft);
        return true;
      }

      // Edit/restart
      if (
        lowerTranscript.includes('edit') ||
        lowerTranscript.includes('change') ||
        lowerTranscript.includes('no') ||
        lowerTranscript.includes('modify')
      ) {
        updateState({
          currentStep: CONVERSATION_STEPS.TITLE,
          entryDraft: { fields: [] },
        });

        setTimeout(() => {
          voiceProcessor.setLastTTSPrompt("Let's start over. What would you like to call this entry?");
          speak("Let's start over. What would you like to call this entry?");
          toast.info('🔄 Restarting entry creation');
        }, 300);

        return true;
      }

      // Ask for clarification
      setTimeout(() => {
        const clarificationMessage =
          "Please say 'save' to create the entry, 'add custom fields' to add fields, or 'edit' to make changes.";
        voiceProcessor.setLastTTSPrompt(clarificationMessage);
        speak(clarificationMessage);
        toast.info("Say 'save', 'add custom fields', or 'edit'");
      }, 300);

      return true;
    },
    [onSaveEntry]
  );

  /**
   * Create entry from draft
   */
  const createEntryFromDraft = useCallback(
    (draft: EntryDraft) => {
      const normalizedFields = Object.fromEntries(
        draft.fields.map(field => [normalizeToDbFieldName(field.name), ''])
      );

      const entry = {
        title: draft.title || `New Entry - ${new Date().toLocaleDateString()}`,
        fields: {
          category: draft.category || 'Personal',
          ...normalizedFields,
        },
        fieldDefinitions: [
          { id: 'category', name: 'category', type: 'text' },
          ...draft.fields.map((field, index) => ({
            id: `field_${Date.now()}_${index}`,
            name: normalizeToDbFieldName(field.name),
            type: field.type,
          })),
        ],
      };

      onSaveEntry(entry);

      // Reset conversation IMMEDIATELY before speaking
      const newState = INITIAL_STATE;
      stateRef.current = newState;
      setConversationState(newState);

      const successMessage = `🎉 Created entry "${entry.title}" in ${entry.fields.category}${
        draft.fields.length > 0 ? ` with ${draft.fields.length} custom fields` : ''
      }`;
      toast.success(successMessage);

      setTimeout(() => {
        voiceProcessor.setLastTTSPrompt(successMessage);
        speak(successMessage);
      }, 300);
    },
    [onSaveEntry]
  );

  /**
   * Update conversation state
   */
  const updateState = useCallback((updates: Partial<ConversationState>) => {
    const newState = { ...stateRef.current, ...updates };
    stateRef.current = newState;
    setConversationState(newState);
  }, []);

  /**
   * Ask for clarification
   */
  const askForClarification = useCallback((message: string) => {
    setTimeout(() => {
      voiceProcessor.setLastTTSPrompt(message);
      speak(message);
      toast.info(message);
    }, 300);
  }, []);

  /**
   * Get current state (for avoiding stale closures)
   */
  const getState = useCallback(() => stateRef.current, []);

  return {
    conversationState,
    startConversation,
    endConversation,
    processStep,
    getState,
    isInConversation: conversationState.isInConversation,
  };
}
