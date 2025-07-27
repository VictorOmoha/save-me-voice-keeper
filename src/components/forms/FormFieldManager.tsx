
import { CustomField } from './types';

interface FormFieldManagerProps {
  fields: CustomField[];
  onAddField: () => void;
  onUpdateField: (id: string, key: keyof CustomField, value: any) => void;
  onRemoveField: (id: string) => void;
  isEditMode: boolean;
  isFillMode: boolean;
  highlightedField?: string | null;
  isVoiceActive?: boolean;
}

export const FormFieldManager: React.FC<FormFieldManagerProps> = ({
  fields,
  onAddField,
  onUpdateField,
  onRemoveField,
  isEditMode,
  isFillMode,
  highlightedField,
  isVoiceActive
}) => {
  return (
    <div className={`flex items-center justify-between transition-all duration-300 ${
      highlightedField === 'more_fields' ? 'animate-pulse' : ''
    }`}>
      <label className="text-lg font-semibold text-foreground">
        {isFillMode ? 'Fill in the Data' : 'Custom Fields'}
        {isVoiceActive && (
          <span className="ml-2 text-xs text-blue-500 animate-pulse">🎤</span>
        )}
      </label>
      {(isEditMode || isFillMode) && (
        <button 
          type="button" 
          onClick={onAddField} 
          className={`px-3 py-1 text-sm border border-border rounded hover:bg-accent transition-all duration-300 ${
            highlightedField === 'field_name' ? 'bg-blue-500/10 border-blue-500 animate-bounce' : ''
          }`}
        >
          Add Field
        </button>
      )}
    </div>
  );
};
