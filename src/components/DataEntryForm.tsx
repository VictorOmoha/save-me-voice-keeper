
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SavedEntry } from "@/pages/Dashboard";
import { useFormLogic } from "./forms/useFormLogic";
import { CategorySelector } from "./forms/CategorySelector";
import { FormFieldManager } from "./forms/FormFieldManager";
import { CustomFieldItem } from "./forms/CustomFieldItem";

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
    prepareSubmissionData,
    categories
  } = useFormLogic({ editEntry, templateEntry, mode, preselectedCategory });

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
            />
          ))}
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" onClick={onCancel} variant="outline">
            Cancel
          </Button>
          <Button type="submit" className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
            {editEntry ? 'Update Entry' : isFillMode ? 'Save Data' : 'Save Entry'}
          </Button>
        </div>
      </form>
    </div>
  );
};
