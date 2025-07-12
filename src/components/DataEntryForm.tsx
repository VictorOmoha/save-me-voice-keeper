
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
    console.log('🔧 DataEntryForm: unregisterFormSetters available:', !!unregisterFormSetters);
    console.log('🔧 DataEntryForm: setTitle available:', !!setTitle);
    console.log('🔧 DataEntryForm: setSelectedCategory available:', !!setSelectedCategory);
    
    if (registerFormSetters && unregisterFormSetters) {
      console.log('✅ DataEntryForm: Registering voice form setters');
      registerFormSetters(setTitle, setSelectedCategory);
      
      return () => {
        console.log('🧹 DataEntryForm: Unregistering voice form setters');
        unregisterFormSetters();
      };
    } else {
      console.log('❌ DataEntryForm: Voice form context not available');
    }
  }, [registerFormSetters, unregisterFormSetters, setTitle, setSelectedCategory]);

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
