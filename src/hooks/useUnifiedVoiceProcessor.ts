import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { speak } from '@/utils/textToSpeech';
import { SavedEntry } from '@/types/dashboard';
import { voiceProcessor, EnhancedVoiceCommand } from '@/utils/enhancedVoiceProcessor';

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
  PREVIEW: {
    type: 'preview' as const,
    question: "Here's your entry preview. Would you like to save this entry or edit something?",
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

  // Use ref to track current conversation state for immediate access
  const conversationStateRef = useRef<UnifiedVoiceState>(conversationState);
  
  // Keep ref in sync with state
  conversationStateRef.current = conversationState;

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
    
    // Ask the first question and track TTS
    setTimeout(() => {
      voiceProcessor.setLastTTSPrompt(CONVERSATION_STEPS.TITLE.question);
      speak(CONVERSATION_STEPS.TITLE.question);
      toast.info("🎤 Let's create your entry! " + CONVERSATION_STEPS.TITLE.question);
    }, 500);
  }, [onCreateEntry]);

  // Helper function to clean voice input - improved to separate TTS from user input
  const cleanVoiceInput = useCallback((text: string): string => {
    let cleaned = text.trim();
    
    // Try to extract only the user's actual response by removing TTS echo
    // Common TTS patterns that get picked up by speech recognition
    const ttsPatterns = [
      /^(what would you like to call this entry\??\s*)/i,
      /^(what category should this entry be in\??\s*you can say[^.]*\.\s*)/i,
      /^(perfect\!?\s*entry preview[^.]*\.\s*say save[^.]*\.\s*)/i,
      /^(would you like to add any custom fields\??\s*)/i,
      /^(what should this field be called\??\s*)/i,
      /^(what type of field should this be\??\s*)/i,
    ];
    
    // Remove TTS prompts from the beginning
    for (const pattern of ttsPatterns) {
      cleaned = cleaned.replace(pattern, '').trim();
    }
    
    // If we have multiple sentences, try to get the last one as the user response
    const sentences = cleaned.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length > 1) {
      // Take the last substantial sentence as the user's response
      const lastSentence = sentences[sentences.length - 1].trim();
      if (lastSentence.length >= 2) {
        cleaned = lastSentence;
      }
    }
    
    // Remove leading/trailing punctuation
    cleaned = cleaned.replace(/^[\?\!\.\,\;\:]+\s*/, '');
    cleaned = cleaned.replace(/\s*[\?\!\.\,\;\:]+$/, '');
    
    console.log(`🧹 Cleaned input "${text}" → "${cleaned}"`);
    return cleaned;
  }, []);

  // Enhanced fuzzy matching for categories
  const matchCategory = useCallback((input: string): string | null => {
    const categoryMappings = {
      'Documents': ['documents', 'document', 'docs', 'doc', 'files', 'file', 'paperwork', 'papers'],
      'Health': ['health', 'medical', 'healthcare', 'medicine', 'doctor', 'wellness', 'fitness'],
      'Contacts': ['contacts', 'contact', 'people', 'person', 'friends', 'friend', 'family', 'relationships'],
      'Finance': ['finance', 'financial', 'money', 'bank', 'budget', 'expense', 'income', 'banking'],
      'Personal': ['personal', 'private', 'myself', 'self', 'misc', 'other', 'general']
    };
    
    const lowerInput = input.toLowerCase().trim();
    
    // First, try exact matches
    for (const [category, variations] of Object.entries(categoryMappings)) {
      if (variations.some(variation => lowerInput === variation)) {
        console.log(`🎯 Exact category match: "${input}" → "${category}"`);
        return category;
      }
    }
    
    // Then try substring matches with higher confidence
    for (const [category, variations] of Object.entries(categoryMappings)) {
      if (variations.some(variation => lowerInput.includes(variation) && variation.length >= 4)) {
        console.log(`🎯 Fuzzy category match: "${input}" → "${category}"`);
        return category;
      }
    }
    
    console.log(`❌ No category match found for: "${input}"`);
    return null;
  }, []);

  // Check if input seems confident (not too short or contains uncertainty markers)
  const isInputConfident = useCallback((input: string, stepType: string): boolean => {
    if (!input || input.length < 2) return false;
    
    const uncertaintyMarkers = ['um', 'uh', 'maybe', 'i think', 'possibly', 'perhaps'];
    const lowerInput = input.toLowerCase();
    
    if (uncertaintyMarkers.some(marker => lowerInput.includes(marker))) {
      return false;
    }
    
    // For titles, require at least 2 characters
    if (stepType === 'title' && input.length < 2) return false;
    
    return true;
  }, []);

  const processConversationStep = useCallback((transcript: string) => {
    console.log('🎯 processConversationStep called with:', transcript);
    
    // Use ref for current state to avoid stale closure
    const currentState = conversationStateRef.current;
    console.log('🔍 Current conversation state:', { 
      isInConversation: currentState.isInConversation, 
      stepType: currentState.currentStep?.type 
    });
    
    if (!currentState.isInConversation || !currentState.currentStep) {
      console.log('❌ Not in conversation or no current step');
      return false;
    }

    const { currentStep, entryDraft } = currentState;
    
    // Clean the input text
    const cleanedText = cleanVoiceInput(transcript);
    const lowerTranscript = cleanedText.toLowerCase().trim();
    
    console.log('📝 Processing conversation step:', currentStep.type, 'with cleaned input:', cleanedText);
    
    // If cleaned text is empty or too short, ask for clarification
    if (!cleanedText || cleanedText.length < 1) {
      const clarificationMessage = `I didn't catch that. ${currentStep.question}`;
      setTimeout(() => {
        speak(clarificationMessage);
        toast.info(clarificationMessage);
      }, 300);
      return false;
    }

    switch (currentStep.type) {
      case 'title':
        // Require minimum length but be more lenient
        if (cleanedText.length < 2) {
          const retryMessage = `Please say the title more clearly.`;
          setTimeout(() => {
            speak(retryMessage);
            toast.info(retryMessage);
          }, 300);
          return false;
        }
        
        const title = cleanedText;
        const newEntryDraft = { ...entryDraft, title };
        
        console.log('🎤 Title captured:', title);
        console.log('📝 Updated entry draft:', newEntryDraft);
        
        setConversationState(prev => ({
          ...prev,
          currentStep: CONVERSATION_STEPS.CATEGORY,
          entryDraft: newEntryDraft,
        }));
        
        // Update form immediately
        if (formTitleSetter) {
          formTitleSetter(title);
        }
        
        // Update live feedback
        window.dispatchEvent(new CustomEvent('voice-data-update', {
          detail: { type: 'title', value: title }
        }));
        
        setTimeout(() => {
          voiceProcessor.setLastTTSPrompt(CONVERSATION_STEPS.CATEGORY.question);
          speak(CONVERSATION_STEPS.CATEGORY.question);
          toast.success(`✅ Title set: "${title}"`);
        }, 300);
        console.log('➡️ Moving to category selection');
        break;

      case 'category':
        // Use fuzzy matching for category
        const matchedCategory = matchCategory(cleanedText);
        
        if (!matchedCategory) {
          const retryMessage = `I heard "${cleanedText}" - please say one of: Documents, Health, Contacts, Finance, or Personal.`;
            setTimeout(() => {
              voiceProcessor.setLastTTSPrompt(retryMessage);
              speak(retryMessage);
              toast.info(retryMessage);
            }, 300);
          return false;
        }
        
        console.log('🎤 Category captured:', matchedCategory);
        const updatedDraft = { ...entryDraft, category: matchedCategory };
        console.log('📝 Updated entry draft with category:', updatedDraft);
        
        setConversationState(prev => ({
          ...prev,
          currentStep: CONVERSATION_STEPS.PREVIEW,
          entryDraft: updatedDraft,
        }));
        
        if (formCategorySetter) {
          formCategorySetter(matchedCategory);
        }
        
        // Update live feedback
        window.dispatchEvent(new CustomEvent('voice-data-update', {
          detail: { type: 'category', value: matchedCategory }
        }));
        
        setTimeout(() => {
          const previewMessage = `Perfect! Entry preview: Title "${updatedDraft.title}" in ${matchedCategory} category. Say "save" to create it or "edit" to make changes.`;
          voiceProcessor.setLastTTSPrompt(previewMessage);
          speak(previewMessage);
          toast.success(`✅ Category set: ${matchedCategory}`);
        }, 300);
        console.log('➡️ Moving to preview step');
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
          // Move to preview instead of creating directly
          setConversationState(prev => ({
            ...prev,
            currentStep: CONVERSATION_STEPS.PREVIEW,
          }));
          setTimeout(() => {
            speak(CONVERSATION_STEPS.PREVIEW.question);
            toast.info("📋 Showing entry preview");
          }, 300);
        }
        break;

      case 'field_name':
        setConversationState({
          ...conversationState,
          currentStep: CONVERSATION_STEPS.FIELD_TYPE,
          currentFieldName: cleanedText,
        });
        speak(CONVERSATION_STEPS.FIELD_TYPE.question);
        toast.success(`📝 Field name set: "${cleanedText}"`);
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

      case 'preview':
        // Check for custom fields request first
        if (lowerTranscript.includes('add custom') || lowerTranscript.includes('custom field') || 
            lowerTranscript.includes('add field') || lowerTranscript.includes('more field')) {
          console.log('🎯 User wants to add custom fields, moving to field creation');
          setConversationState(prev => ({
            ...prev,
            currentStep: CONVERSATION_STEPS.FIELD_NAME,
          }));
          setTimeout(() => {
            voiceProcessor.setLastTTSPrompt(CONVERSATION_STEPS.FIELD_NAME.question);
            speak(CONVERSATION_STEPS.FIELD_NAME.question);
            toast.info("📝 Adding custom field - what should it be called?");
          }, 300);
        } else if (lowerTranscript.includes('save') || lowerTranscript.includes('yes') || 
                   lowerTranscript.includes('looks good') || lowerTranscript.includes('create')) {
          console.log('🎯 User wants to save entry');
          createEntryFromDraft(entryDraft);
        } else if (lowerTranscript.includes('edit') || lowerTranscript.includes('change') || 
                   lowerTranscript.includes('no') || lowerTranscript.includes('modify')) {
          // Go back to title for editing
          setConversationState(prev => ({
            ...prev,
            currentStep: CONVERSATION_STEPS.TITLE,
            entryDraft: { fields: [] },
          }));
          setTimeout(() => {
            voiceProcessor.setLastTTSPrompt("Let's start over. What would you like to call this entry?");
            speak("Let's start over. What would you like to call this entry?");
            toast.info("🔄 Restarting entry creation");
          }, 300);
        } else {
          // Ask for clarification with more options
          setTimeout(() => {
            const clarificationMessage = "Please say 'save' to create the entry, 'add custom fields' to add fields, or 'edit' to make changes.";
            voiceProcessor.setLastTTSPrompt(clarificationMessage);
            speak(clarificationMessage);
            toast.info("Say 'save', 'add custom fields', or 'edit'");
          }, 300);
        }
        break;
    }

    return true;
  }, [formTitleSetter, formCategorySetter, formAddFieldFunction, cleanVoiceInput, matchCategory]);

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
    console.log('🎙️ DEBUG UNIFIED: Processing voice input:', transcript);
    
    // Use ref to get the current state (not stale closure state)
    const currentState = conversationStateRef.current;
    console.log('🔍 DEBUG UNIFIED: Conversation state check - isInConversation:', currentState.isInConversation);
    console.log('🔍 DEBUG UNIFIED: Current step:', currentState.currentStep?.type);
    console.log('🔍 DEBUG UNIFIED: Full conversation state:', currentState);
    
    // CRITICAL: If we're in a conversation, ONLY process conversation steps
    if (currentState.isInConversation) {
      console.log('🎯 IN CONVERSATION MODE - Processing step input');
      const handled = processConversationStep(transcript);
      console.log('🔍 Step processing result:', handled);
      // ALWAYS return when in conversation mode - never fall through to commands
      return;
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
      
      // Block fallback commands during active conversation
      if (command.action === 'tts_feedback_blocked') {
        console.log('🚫 TTS feedback blocked, ignoring');
        return;
      }
      
      // Don't restart wizard if we're already in conversation
      if (command.action === 'create_entry' && currentState.isInConversation) {
        console.log('🚫 Already in conversation, not restarting wizard');
        return;
      }

      switch (command.action) {
        case 'create_entry':
          if (!currentState.isInConversation) {
            startCreateEntryConversation();
          }
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
          if (currentState.isInConversation) {
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
  }, [savedEntries, startCreateEntryConversation, processConversationStep, onEditEntry, onDeleteEntry, onCancelEdit]);

  const cancelConversation = useCallback(() => {
    setConversationState({
      isInConversation: false,
      currentStep: null,
      entryDraft: { fields: [] },
    });
    speak("Conversation cancelled. What else can I help you with?");
    toast.info("❌ Voice conversation cancelled");
  }, []);

  const processHybridSelection = useCallback((value: string) => {
    console.log('🔘 HYBRID: Processing button selection:', value);
    processConversationStep(value);
  }, [processConversationStep]);

  return {
    processVoiceInput,
    conversationState,
    cancelConversation,
    processHybridSelection,
    isInConversation: conversationState.isInConversation,
  };
};
