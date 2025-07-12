
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SavedEntry } from "@/types/dashboard";
import { useFormLogic } from "./forms/useFormLogic";
import { CategorySelector } from "./forms/CategorySelector";
import { FormFieldManager } from "./forms/FormFieldManager";
import { CustomFieldItem } from "./forms/CustomFieldItem";
import { useVoiceFormContext } from "@/contexts/VoiceFormContext";

interface DataEntryFormProps {
  onSave: (entry: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  editEntry?: SavedEntry | null;
  templateEntry?: SavedEntry | null;
  mode?: 'create' | 'edit' | 'fill';
  preselectedCategory?: string;
}

export const DataEntryForm: React.FC<DataEntryFormProps> = ({ 
  onSave, 
  onCancel, 
  editEntry, 
  templateEntry,
  mode = 'create',
  preselectedCategory
}) => {
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
    categories
  } = useFormLogic({ editEntry, templateEntry, mode, preselectedCategory });

  const { registerFormSetters, unregisterFormSetters } = useVoiceFormContext();

  // Register form setters for voice input when component mounts  
  useEffect(() => {
    console.log('🔧 DataEntryForm: useEffect triggered');
    console.log('🔧 DataEntryForm: registerFormSetters available:', !!registerFormSetters);
    
    if (registerFormSetters && unregisterFormSetters) {
      console.log('✅ DataEntryForm: Registering voice form setters');
      
      // Use a small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        // Create enhanced addField function that can handle voice parameters
        const voiceAddField = (fieldName?: string, fieldType?: string) => {
          addField();
          // If we have field details from voice, we'll set them after the field is added
          if (fieldName) {
            // The field will be added with empty name, so we'll update it after
            setTimeout(() => {
              const newFieldId = Date.now().toString();
              updateField(newFieldId, 'name', fieldName);
              if (fieldType && fieldType !== 'text') {
                updateField(newFieldId, 'type', fieldType as any);
              }
            }, 100);
          }
        };
        
        registerFormSetters(setTitle, setSelectedCategory, voiceAddField);
        console.log('🎯 DataEntryForm: Form setters registered with delay including addField');
      }, 100);
      
      return () => {
        clearTimeout(timer);
        console.log('🧹 DataEntryForm: Unregistering voice form setters');
        unregisterFormSetters();
      };
    } else {
      console.log('❌ DataEntryForm: Voice form context not available');
    }
  }, []); // Removed dependencies to prevent re-registration

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(prepareSubmissionData());
  };

  const isEditMode = mode === 'edit' || mode === 'create';
  const isFillMode = mode === 'fill';
  const isCategoryReadonly = !!preselectedCategory || (templateEntry && mode === 'fill');

  return (
    <div className="bg-background text-foreground">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title" className="text-foreground">Entry Title</Label>
          <Input
            id="title"
            placeholder="Give your entry a title (e.g., 'Medication Info', 'Insurance Policy')"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-background border-border text-foreground placeholder:text-muted-foreground"
            required
          />
        </div>

        <CategorySelector
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          isReadonly={isCategoryReadonly}
          categories={categories}
        />

        <div className="space-y-4">
          <FormFieldManager
            fields={fields}
            onAddField={addField}
            onUpdateField={updateField}
            onRemoveField={removeField}
            isEditMode={isEditMode}
            isFillMode={isFillMode}
          />

          {fields.map((field, index) => (
            <CustomFieldItem
              key={field.id}
              field={field}
              index={index}
              fieldsLength={fields.length}
              isEditMode={isEditMode}
              isFillMode={isFillMode}
              onUpdateField={updateField}
              onRemoveField={removeField}
              onMoveField={moveField}
            />
          ))}
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" onClick={onCancel} variant="outline" className="text-foreground border-border">
            Cancel
          </Button>
          <Button type="submit" variant="gradient">
            {editEntry ? 'Update Entry' : isFillMode ? 'Save Data' : 'Save Entry'}
          </Button>
        </div>
      </form>
    </div>
  );
};
