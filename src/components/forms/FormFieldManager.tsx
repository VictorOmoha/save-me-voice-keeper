
import { CustomField } from './types';

interface FormFieldManagerProps {
  fields: CustomField[];
  onAddField: () => void;
  onUpdateField: (id: string, key: keyof CustomField, value: any) => void;
  onRemoveField: (id: string) => void;
  isEditMode: boolean;
  isFillMode: boolean;
}

export const FormFieldManager: React.FC<FormFieldManagerProps> = ({
  fields,
  onAddField,
  onUpdateField,
  onRemoveField,
  isEditMode,
  isFillMode
}) => {
  return (
    <div className="flex items-center justify-between">
      <label className="text-lg font-semibold text-foreground">
        {isFillMode ? 'Fill in the Data' : 'Custom Fields'}
      </label>
      {isEditMode && (
        <button type="button" onClick={onAddField} className="px-3 py-1 text-sm border border-border rounded hover:bg-accent">
          Add Field
        </button>
      )}
    </div>
  );
};
