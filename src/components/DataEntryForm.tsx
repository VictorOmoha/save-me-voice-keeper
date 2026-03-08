
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SavedEntry } from "@/types/dashboard";
import { useFormLogic } from "./forms/useFormLogic";
import { CategorySelector } from "./forms/CategorySelector";
import { FormFieldManager } from "./forms/FormFieldManager";
import { CustomFieldItem } from "./forms/CustomFieldItem";
import { useVoiceFormContext } from "@/contexts/VoiceFormContext";
import { VoiceStatusIndicator } from "./voice/VoiceStatusIndicator";
import { Mic } from "lucide-react";

interface DataEntryFormProps {
  onSave: (entry: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  editEntry?: SavedEntry | null;
  templateEntry?: SavedEntry | null;
  mode?: 'create' | 'edit' | 'fill' | 'template';
  preselectedCategory?: string;
  isVoiceActive?: boolean;
  isSaving?: boolean;
  voiceConversationState?: {
    isInConversation: boolean;
    currentStep?: { type: string; question: string };
    entryDraft?: Record<string, unknown>;
  };
}

export const DataEntryForm: React.FC<DataEntryFormProps> = ({ 
  onSave, 
  onCancel, 
  editEntry, 
  templateEntry,
  mode = 'create',
  preselectedCategory,
  isVoiceActive = false,
  isSaving = false,
  voiceConversationState
}) => {
  const [lastVoiceUpdate, setLastVoiceUpdate] = useState<string>('');
  const [highlightedField, setHighlightedField] = useState<string | null>(null);
  const {
    title,
    setTitle,
    selectedCategory,
    setSelectedCategory,
    fields,
    addField,
    updateField,
    removeField,
    moveField,
    prepareSubmissionData,
    categories,
    isDirty
  } = useFormLogic({ editEntry, templateEntry, mode, preselectedCategory });

  const { registerFormSetters, unregisterFormSetters } = useVoiceFormContext();

  // Keep latest setters/functions in refs so registration effect can run once.
  const titleSetterRef = useRef(setTitle);
  const categorySetterRef = useRef(setSelectedCategory);
  const addFieldRef = useRef(addField);

  useEffect(() => {
    titleSetterRef.current = setTitle;
    categorySetterRef.current = setSelectedCategory;
    addFieldRef.current = addField;
  }, [setTitle, setSelectedCategory, addField]);

  // Handle voice conversation state changes for animations
  useEffect(() => {
    if (voiceConversationState?.currentStep) {
      const stepType = voiceConversationState.currentStep.type;
      setHighlightedField(stepType);
      
      // Clear highlight after animation
      const timer = setTimeout(() => {
        setHighlightedField(null);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [voiceConversationState?.currentStep]);

  // Register form setters once on mount; wrappers read latest refs.
  useEffect(() => {
    console.log('🔧 DataEntryForm: voice registration effect mounted');

    if (registerFormSetters && unregisterFormSetters) {
      const timer = setTimeout(() => {
        const voiceSetTitle = (value: string) => {
          titleSetterRef.current(value);
          setLastVoiceUpdate(`Title updated: ${value}`);
          setHighlightedField('title');
        };

        const voiceSetCategory = (value: string) => {
          categorySetterRef.current(value);
          setLastVoiceUpdate(`Category set: ${value}`);
          setHighlightedField('category');
        };

        const voiceAddField = (fieldName?: string, fieldType?: string) => {
          setLastVoiceUpdate(`Adding field: ${fieldName || 'Custom Field'}`);
          setHighlightedField('field_name');

          const initial: { name?: string; type?: string } = {};
          if (fieldName) initial.name = fieldName;
          if (fieldType) initial.type = fieldType;
          const newId = addFieldRef.current(initial);
          console.debug('🎤 DataEntryForm.voiceAddField -> added field', { newId, fieldName, fieldType });
        };

        registerFormSetters(voiceSetTitle, voiceSetCategory, voiceAddField);
        console.log('🎯 DataEntryForm: Form setters registered');
      }, 100);

      return () => {
        clearTimeout(timer);
        console.log('🧹 DataEntryForm: Unregistering voice form setters');
        unregisterFormSetters();
      };
    }

    console.log('❌ DataEntryForm: Voice form context not available');
  }, [registerFormSetters, unregisterFormSetters]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(prepareSubmissionData());
  };

  const isEditMode = mode === 'edit' || mode === 'fill' || mode === 'create';
  const isFillMode = mode === 'fill';
  const isTemplateMode = mode === 'template';
  const isCategoryReadonly = !!preselectedCategory || (templateEntry && mode === 'template');

  return (
    <div className={`bg-background text-foreground transition-all duration-500 animate-fade-in ${
      isDirty ? 'ring-2 ring-primary/50 shadow-lg shadow-primary/20 bg-primary/5' : ''
    } ${mode === 'create' || mode === 'edit' || mode === 'fill' ? 'mb-20' : ''} ${
      isVoiceActive ? 'ring-2 ring-blue-500/30 shadow-lg shadow-blue-500/10' : ''
    }`}>
      {isVoiceActive && (
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-3 border-b border-border animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Mic className="h-4 w-4 text-blue-500 animate-pulse" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Voice Creation Mode
              </span>
            </div>
            <VoiceStatusIndicator
              connectionStatus="connected"
              isVoiceProcessing={highlightedField !== null}
              conversationState={voiceConversationState?.isInConversation ? 'listening' : 'idle'}
              hasPendingConfirmation={false}
            />
          </div>
          {voiceConversationState?.currentStep && (
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 animate-slide-in-right">
              {voiceConversationState.currentStep.question}
            </p>
          )}
          {lastVoiceUpdate && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1 animate-bounce">
              ✅ {lastVoiceUpdate}
            </p>
          )}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6 p-4 md:p-6">
        <div className={`space-y-2 transition-all duration-300 ${
          highlightedField === 'title' ? 'animate-pulse ring-2 ring-blue-500/50 rounded-lg p-2' : ''
        }`}>
          <Label htmlFor="title" className="text-foreground">Entry Title</Label>
          <Input
            id="title"
            placeholder="Give your entry a title (e.g., 'Medication Info', 'Insurance Policy')"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (title !== e.target.value) {
                setLastVoiceUpdate(`Title updated: ${e.target.value}`);
              }
            }}
            className={`bg-background border-border text-foreground placeholder:text-muted-foreground transition-all duration-300 ${
              highlightedField === 'title' ? 'border-blue-500 ring-1 ring-blue-500/30' : ''
            }`}
            required
          />
          {mode === 'template' && templateEntry && (
            <p className="text-sm text-muted-foreground">
              📋 Using template: "{templateEntry.title}" - Edit the title above for your new entry
            </p>
          )}
        </div>

        <div className={`transition-all duration-300 ${
          highlightedField === 'category' ? 'animate-pulse ring-2 ring-blue-500/50 rounded-lg p-2' : ''
        }`}>
          <CategorySelector
            selectedCategory={selectedCategory}
            onCategoryChange={(category) => {
              setSelectedCategory(category);
              setLastVoiceUpdate(`Category set: ${category}`);
            }}
            isReadonly={isCategoryReadonly}
            categories={categories}
            highlightedField={highlightedField}
          />
        </div>

        <div className="space-y-4">
          <FormFieldManager
            fields={fields}
            onAddField={addField}
            onUpdateField={updateField}
            onRemoveField={removeField}
            isEditMode={isEditMode}
            isFillMode={isFillMode}
            highlightedField={highlightedField}
            isVoiceActive={isVoiceActive}
          />

          {fields.map((field, index) => (
            <div 
              key={field.id}
              className={`animate-fade-in ${
                index === fields.length - 1 && highlightedField === 'field_name' 
                  ? 'animate-scale-in animate-bounce' 
                  : ''
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CustomFieldItem
                field={field}
                index={index}
                fieldsLength={fields.length}
                isEditMode={isEditMode}
                isFillMode={isFillMode}
                onUpdateField={updateField}
                onRemoveField={removeField}
                onMoveField={moveField}
                highlightedField={highlightedField}
                isVoiceCreated={index === fields.length - 1 && highlightedField === 'field_name'}
              />
            </div>
          ))}
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:space-x-2 pt-4">
          <Button type="button" onClick={onCancel} variant="outline" className="text-foreground border-border w-full sm:w-auto" disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" variant="gradient" className="w-full sm:w-auto" disabled={isSaving}>
            {isSaving ? 'Saving...' : editEntry ? 'Update Entry' : isTemplateMode ? 'Save Entry' : isFillMode ? 'Save Data' : 'Save Entry'}
          </Button>
        </div>
      </form>
    </div>
  );
};
