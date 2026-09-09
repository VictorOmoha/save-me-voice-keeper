
import React from 'react';
import { CustomField } from './types';
import { Badge } from '@/components/ui/badge';
import { Table, Plus } from 'lucide-react';

interface FormFieldManagerProps {
  fields: CustomField[];
  onAddField: () => void;
  onUpdateField: (id: string, key: keyof CustomField, value: unknown) => void;
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
  const tableFields = fields.filter(field => field.type === 'table');
  const hasTableFields = tableFields.length > 0;
  
  return (
    <div className={`space-y-3 transition-all duration-300 ${
      highlightedField === 'more_fields' ? 'animate-pulse' : ''
    }`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-semibold text-foreground">
          Additional details
          {isVoiceActive && (
            <span className="ml-2 text-xs text-blue-500 animate-pulse">🎤</span>
          )}
        </label>
        
        {isFillMode && hasTableFields && (
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            >
              <Table className="h-3 w-3 mr-1" />
              Table fields
            </Badge>
            <span className="text-xs text-muted-foreground">
              {tableFields.length} table{tableFields.length !== 1 ? 's' : ''} ready
            </span>
          </div>
        )}
      </div>
      
      {(isEditMode || isFillMode) && (
        <button 
          type="button" 
          onClick={onAddField} 
          className={`min-h-11 px-3 py-2 text-sm border border-border rounded hover:bg-accent transition-all duration-300 flex items-center gap-1 ${
            highlightedField === 'field_name' ? 'bg-blue-500/10 border-blue-500 animate-bounce' : ''
          }`}
        >
          <Plus className="h-3 w-3" />
          Add Field
        </button>
      )}
      </div>

      {fields.length === 0 && (
        <div className="text-sm text-muted-foreground">
          Optional: add a date, phone number, image, or another detail.
        </div>
      )}
    </div>
  );
};
