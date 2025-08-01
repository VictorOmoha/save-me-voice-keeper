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

  const pendingDeleteEntry = useRef<any>(null);

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

  const cleanVoiceInput = useCallback((input: string): string => {
    if (!input) return '';
    
    console.log('🧹 Cleaning voice input:', input);
    
    // Check if this is pure TTS feedback that should be completely ignored
    const pureTtsPatterns = [
      /^What would you like to call this entry\?$/i,
      /^What category should this entry be in\? You can say Documents, Health, Contacts, Finance, or Personal\.$/i,
      /^What type of field should this be\? You can say text,? number,? date,? or text ?area\.?$/i,
      /^Would you like to add any custom fields\? Say yes to add fields, or no to create the entry now\.$/i,
      /^What would you like to name this field\?$/i,
      /^Perfect.*entry preview.*$/i,
      /^I didn't catch that\..*$/i,
      /^Please try again\.$/i,
      /^Voice mode activated\.$/i,
      /^How can I help you\?$/i
    ];
    
    // If it's pure TTS feedback, return special marker
    const trimmedInput = input.trim();
    for (const pattern of pureTtsPatterns) {
      if (pattern.test(trimmedInput)) {
        console.log('🧹 Detected pure TTS feedback, returning marker');
        return '__TTS_FEEDBACK__';
      }
    }
    
    // Remove common TTS feedback patterns from mixed input
    const ttsPatterns = [
      /^(What would you like to call this entry\?)\s*/i,
      /^(What category should this entry be in\?)\s*/i,
      /^(Perfect.*entry preview.*)\s*/i,
      /^(Would you like to add any custom fields\?)\s*/i,
      /^(What type of field.*)\s*/i,
      /^(I didn't catch that\.)\s*/i,
      /^(Please try again\.)\s*/i,
      /^(Voice mode activated\.)\s*/i,
      /^(How can I help you\?)\s*/i
    ];
    
    let cleaned = trimmedInput;
    
    // Remove TTS patterns from the beginning
    for (const pattern of ttsPatterns) {
      if (pattern.test(cleaned)) {
        cleaned = cleaned.replace(pattern, '').trim();
        console.log('🧹 Removed TTS pattern, remaining:', cleaned);
        // If nothing meaningful remains after removing TTS, return empty
        if (cleaned.length < 2) {
          console.log('🧹 Input was mostly TTS feedback, returning empty');
          return '';
        }
      }
    }
    
    // Extract meaningful content from mixed TTS+user input
    // Look for content after question marks, periods, or common TTS endings
    const meaningfulParts = cleaned.split(/[.?!]\s+/);
    if (meaningfulParts.length > 1) {
      // Take the last meaningful part that's not too short
      const lastPart = meaningfulParts[meaningfulParts.length - 1].trim();
      if (lastPart.length >= 2) {
        console.log('🧹 Extracted meaningful part:', lastPart);
        cleaned = lastPart;
      }
    }
    
    console.log('🧹 Final cleaned input:', cleaned);
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
    
    // First check if this looks like TTS feedback before cleaning
    const originalLower = transcript.toLowerCase().trim();
    const isTTSFeedback = originalLower.includes('what type of field should this be') ||
                         originalLower.includes('you can say text') ||
                         originalLower.includes('number') && originalLower.includes('date') ||
                         originalLower.includes('what would you like to call') ||
                         originalLower.includes('what category should') ||
                         originalLower.includes('perfect entry preview') ||
                         originalLower.includes('voice mode activated') ||
                         originalLower.includes('how can i help you');
    
    if (isTTSFeedback) {
      console.log('🎤 Detected TTS feedback, ignoring transcript:', transcript);
      return false;
    }
    
    // Clean the input text
    const cleanedText = cleanVoiceInput(transcript);
    const lowerTranscript = cleanedText.toLowerCase().trim();
    
    console.log('📝 Processing conversation step:', currentStep.type, 'with cleaned input:', cleanedText);
    
    // Handle special TTS feedback marker
    if (cleanedText === '__TTS_FEEDBACK__') {
      console.log('🎤 Detected TTS feedback marker, ignoring...');
      return false;
    }
    
    // If cleaned text is empty or too short after cleaning
    if (!cleanedText || cleanedText.length < 1) {
      const clarificationMessage = `I didn't catch that. ${currentStep.question}`;
      setTimeout(() => {
        voiceProcessor.setLastTTSPrompt(clarificationMessage);
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
        
        console.log(`🎯 Category matching result: input="${cleanedText}", matched="${matchedCategory}"`);
        
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
          currentStep: CONVERSATION_STEPS.MORE_FIELDS,
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
          voiceProcessor.setLastTTSPrompt(CONVERSATION_STEPS.MORE_FIELDS.question);
          speak(CONVERSATION_STEPS.MORE_FIELDS.question);
          toast.success(`✅ Category set: ${matchedCategory}`);
        }, 300);
        console.log('➡️ Moving to preview step');
        break;

      case 'more_fields':
        if (lowerTranscript.includes('yes') || lowerTranscript.includes('add')) {
          setConversationState(prev => ({
            ...prev,
            currentStep: CONVERSATION_STEPS.FIELD_NAME,
            isInConversation: true,
          }));
          setTimeout(() => {
            voiceProcessor.setLastTTSPrompt(CONVERSATION_STEPS.FIELD_NAME.question);
            speak(CONVERSATION_STEPS.FIELD_NAME.question);
            toast.info("📝 Adding custom field - what should it be called?");
          }, 300);
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
        setConversationState(prev => ({
          ...prev,
          currentStep: CONVERSATION_STEPS.FIELD_TYPE,
          currentFieldName: cleanedText,
          isInConversation: true,
        }));
        setTimeout(() => {
          voiceProcessor.setLastTTSPrompt(CONVERSATION_STEPS.FIELD_TYPE.question);
          speak(CONVERSATION_STEPS.FIELD_TYPE.question);
          toast.success(`📝 Field name set: "${cleanedText}"`);
        }, 300);
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
        
        setConversationState(prev => ({
          ...prev,
          currentStep: CONVERSATION_STEPS.MORE_FIELDS,
          entryDraft: draftWithField,
          currentFieldName: undefined,
          isInConversation: true,
        }));
        
        // Add field to form
        if (formAddFieldFunction) {
          formAddFieldFunction(newField.name, matchedType);
        }
        
        setTimeout(() => {
          voiceProcessor.setLastTTSPrompt(CONVERSATION_STEPS.MORE_FIELDS.question);
          speak(`Added ${matchedType} field "${newField.name}". ${CONVERSATION_STEPS.MORE_FIELDS.question}`);
          toast.success(`✅ Added field: ${newField.name} (${matchedType})`);
        }, 300);
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
    
    // Reset conversation IMMEDIATELY before speaking to prevent TTS feedback loop
    setConversationState({
      isInConversation: false,
      currentStep: null,
      entryDraft: { fields: [] },
    });
    
    const successMessage = `🎉 Created entry "${entry.title}" in ${entry.fields.category}${draft.fields.length > 0 ? ` with ${draft.fields.length} custom fields` : ''}`;
    toast.success(successMessage);
    
    // Set TTS prompt to prevent feedback loop and speak after a delay
    setTimeout(() => {
      voiceProcessor.setLastTTSPrompt(successMessage);
      speak(successMessage);
    }, 300);
  }, [onSaveEntry]);

  const processVoiceInput = useCallback(async (transcript: string) => {
    console.log('🎙️ DEBUG UNIFIED: Processing voice input:', transcript);
    
    // Use ref to get the current state (not stale closure state)
    const currentState = conversationStateRef.current;
    console.log('🔍 DEBUG UNIFIED: Conversation state check - isInConversation:', currentState.isInConversation);
    console.log('🔍 DEBUG UNIFIED: Current step:', currentState.currentStep?.type);
    console.log('🔍 DEBUG UNIFIED: Full conversation state:', currentState);
    
    // Handle confirmations for enhanced processor commands FIRST
    if (voiceProcessor.hasPendingConfirmation() && pendingDeleteEntry.current) {
      const cleanText = transcript.toLowerCase().trim().replace(/[.,!?]+$/g, '');
      console.log('🤔 UNIFIED: Checking confirmation for pending delete:', cleanText);
      
      const yesPatterns = ['yes', 'yeah', 'yep', 'confirm', 'delete', 'do it', 'proceed'];
      const noPatterns = ['no', 'nope', 'cancel', 'stop', 'abort', 'nevermind', 'never mind'];
      
      const isConfirmation = yesPatterns.some(pattern => cleanText.includes(pattern));
      const isCancellation = noPatterns.some(pattern => cleanText.includes(pattern));
      
      if (isConfirmation || isCancellation) {
        console.log('✅ UNIFIED: Processing confirmation response:', isConfirmation ? 'confirmed' : 'cancelled');
        
        // Clear pending state first
        const deleteParams = pendingDeleteEntry.current;
        pendingDeleteEntry.current = null;
        voiceProcessor.clearConfirmationState();
        
        // Execute the delete through dashboard handler
        if (isConfirmation && deleteParams.entryId) {
          await onDeleteEntry(deleteParams.entryId);
        } else if (isConfirmation && deleteParams.entryTitle) {
          const entry = savedEntries.find(e => 
            e.title.toLowerCase().includes(deleteParams.entryTitle.toLowerCase())
          );
          if (entry) {
            await onDeleteEntry(entry.id);
          }
        } else if (isCancellation) {
          const cancelMessage = "Deletion cancelled.";
          setTimeout(() => {
            voiceProcessor.setLastTTSPrompt(cancelMessage);
            speak(cancelMessage);
            toast.info(cancelMessage);
          }, 300);
        }
        return;
      }
    }
    
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
          let entry = null;
          
          // First try to find by entryId if provided
          if (command.parameters.entryId) {
            entry = savedEntries.find(e => e.id === command.parameters.entryId);
          }
          
          // Fallback to finding by title if entryId didn't work or wasn't provided
          if (!entry && command.parameters.entryTitle) {
            entry = savedEntries.find(e => 
              e.title.toLowerCase().includes(command.parameters.entryTitle.toLowerCase())
            );
          }
          
          // Also try using the title from parameters if available
          if (!entry && command.parameters.title) {
            entry = savedEntries.find(e => 
              e.title.toLowerCase().includes(command.parameters.title.toLowerCase())
            );
          }
          
          if (entry) {
            onEditEntry(entry);
            const successMessage = `Opening ${entry.title}`;
            
            // Set TTS prompt BEFORE speaking to prevent feedback loop
            setTimeout(() => {
              voiceProcessor.setLastTTSPrompt(successMessage);
              speak(successMessage);
              toast.success(`📂 Opening: ${entry.title}`);
            }, 300);
          } else {
            const searchTerm = command.parameters.entryTitle || command.parameters.title || 'entry';
            const errorMessage = `Entry "${searchTerm}" not found`;
            
            // Set TTS prompt BEFORE speaking to prevent feedback loop
            setTimeout(() => {
              voiceProcessor.setLastTTSPrompt(errorMessage);
              speak(errorMessage);
              toast.error(`❌ Entry "${searchTerm}" not found`);
            }, 300);
          }
          break;
          
        case 'close_entry':
          // Close the currently open entry by calling the cancel edit function
          onCancelEdit();
          const closeMessage = "Closing entry";
          
          // Set TTS prompt BEFORE speaking to prevent feedback loop
          setTimeout(() => {
            voiceProcessor.setLastTTSPrompt(closeMessage);
            speak(closeMessage);
            toast.success("📄 Entry closed");
          }, 300);
          break;
          
        case 'delete_entry':
          // Handle enhanced processor commands that need confirmation
          if (command.needsConfirmation) {
            console.log('🔄 UNIFIED: Enhanced processor command needs confirmation, storing as pending');
            pendingDeleteEntry.current = command.parameters;
            
            // Speak the confirmation message and track TTS
            const confirmationMessage = command.conversationalResponse || "Are you sure you want to delete this entry? Say yes to confirm or no to cancel.";
            setTimeout(() => {
              voiceProcessor.setLastTTSPrompt(confirmationMessage);
              speak(confirmationMessage);
              toast.info(confirmationMessage);
            }, 300);
          } else {
            // Handle simple delete commands
            if (command.parameters.entryTitle) {
              const entry = savedEntries.find(e => 
                e.title.toLowerCase().includes(command.parameters.entryTitle.toLowerCase())
              );
              if (entry) {
                onDeleteEntry(entry.id);
              }
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
      
      // Legacy delete confirmation handling (keeping for compatibility)
      if (transcript.toLowerCase().includes('confirm delete') && pendingDeleteEntry.current) {
        const entry = pendingDeleteEntry.current;
        pendingDeleteEntry.current = null;
        voiceProcessor.clearConfirmationState();
        onDeleteEntry(entry.id);
        speak(`Deleted "${entry.title}"`);
        toast.success(`🗑️ Deleted: ${entry.title}`);
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
