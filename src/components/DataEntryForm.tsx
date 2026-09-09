
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SavedEntry } from "@/types/dashboard";
import { CustomField } from "./forms/types";
import { useFormLogic } from "./forms/useFormLogic";
import { CategorySelector } from "./forms/CategorySelector";
import { FormFieldManager } from "./forms/FormFieldManager";
import { CustomFieldItem } from "./forms/CustomFieldItem";
import { useVoiceFormContext } from "@/contexts/VoiceFormContext";
import { VoiceStatusIndicator } from "./voice/VoiceStatusIndicator";
import { toast } from "sonner";
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

          const initial: Partial<CustomField> = {};
          if (fieldName) initial.name = fieldName;
          if (fieldType) {
            const validTypes: CustomField['type'][] = ['text', 'number', 'date', 'textarea', 'image', 'gallery', 'table'];
            const matchedType = validTypes.find(t => t === fieldType);
            if (matchedType) initial.type = matchedType;
          }
          const newId = addFieldRef.current(initial);
          console.debug('🎤 DataEntryForm.voiceAddField -> added field', { newId, fieldName, fieldType });
        };

        registerFormSetters(voiceSetTitle, voiceSetCategory, voiceAddField);
      }, 100);

      return () => {
        clearTimeout(timer);
        unregisterFormSetters();
      };
    }
  }, [registerFormSetters, unregisterFormSetters]);

  const hasRequiredBasics = title.trim().length > 0 && selectedCategory.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (!hasRequiredBasics) {
      toast.error('Add a title and category before saving.');
      return;
    }
    onSave(prepareSubmissionData());
  };

  const isEditMode = true;
  const isFillMode = mode === 'fill';
  const isTemplateMode = mode === 'template';
  const isCategoryReadonly = !!preselectedCategory || (templateEntry && mode === 'template');
  const notesField = fields.find(field => /^(notes|content)$/i.test(field.name) && (field.type === 'text' || field.type === 'textarea'));
  const additionalFields = fields.filter(field => field !== notesField);

  return (
    <div className="workspace-form mx-auto w-full max-w-3xl rounded-2xl border border-border/70 bg-card text-foreground">
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
      
      <form onSubmit={handleSubmit} className="space-y-6 p-5 md:p-7">
        <div>
          <h2 className="text-lg font-semibold">{isFillMode ? 'Fill in memory details' : editEntry ? 'Edit memory' : isTemplateMode ? 'New from template' : 'Save a memory'}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{isFillMode ? 'Complete the fields below and update your saved memory.' : 'Give it a title, add what matters, and choose where it belongs.'}</p>
        </div>

        <div className={`space-y-2 transition-all duration-300 ${
          highlightedField === 'title' ? 'animate-pulse ring-2 ring-blue-500/50 rounded-lg p-2' : ''
        }`}>
          <Label htmlFor="title" className="text-foreground">Title</Label>
          <Input
            id="title"
            placeholder="Give this memory a name"
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

        {notesField && <div className="space-y-2">
          <Label htmlFor="memory-notes">Notes</Label>
          <Textarea id="memory-notes" placeholder="Write the details you want to remember…" className="min-h-40 text-base"
            value={String(notesField.value ?? '')} onChange={event => updateField(notesField.id, 'value', event.target.value)} />
        </div>}
        <div className="space-y-4 border-t border-border/60 pt-5">
          <FormFieldManager
            fields={additionalFields}
            onAddField={addField}
            onUpdateField={updateField}
            onRemoveField={removeField}
            isEditMode={isEditMode}
            isFillMode={isFillMode}
            highlightedField={highlightedField}
            isVoiceActive={isVoiceActive}
          />

          {additionalFields.map((field) => (
            <div 
              key={field.id}
            >
              <CustomFieldItem
                field={field}
                index={fields.indexOf(field)}
                fieldsLength={fields.length}
                isEditMode={isEditMode}
                isFillMode={isFillMode}
                onUpdateField={updateField}
                onRemoveField={removeField}
                onMoveField={moveField}
                highlightedField={highlightedField}
                isVoiceCreated={field === fields[fields.length - 1] && highlightedField === 'field_name'}
              />
            </div>
          ))}
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 border-t border-border/60 pt-5">
          <Button type="button" onClick={onCancel} variant="outline" className="text-foreground border-border w-full sm:w-auto" disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" className="w-full sm:w-auto min-h-11" disabled={isSaving || !hasRequiredBasics}>
            {isSaving ? 'Saving...' : editEntry ? 'Update Entry' : isTemplateMode ? 'Save Entry' : isFillMode ? 'Save Data' : 'Save Entry'}
          </Button>
        </div>
      </form>
    </div>
  );
};
