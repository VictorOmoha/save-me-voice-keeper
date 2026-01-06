import React, { memo, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { CustomField, TableData } from './types';
import { TableFieldEditor } from './table/TableFieldEditor';
import { TableFieldViewer } from './table/TableFieldViewer';
import { ShoppingListTemplate } from './table/ShoppingListTemplate';
import { EnhancedTableFillMode } from './table/EnhancedTableFillMode';

interface OptimizedCustomFieldItemProps {
  field: CustomField;
  onUpdateField: (id: string, key: keyof CustomField, value: any) => void;
  onRemoveField: (id: string) => void;
  isEditMode: boolean;
  isFillMode: boolean;
  highlightedField?: string | null;
  isVoiceActive?: boolean;
}

export const OptimizedCustomFieldItem = memo<OptimizedCustomFieldItemProps>(({
  field,
  onUpdateField,
  onRemoveField,
  isEditMode,
  isFillMode,
  highlightedField,
  isVoiceActive
}) => {
  const isHighlighted = useMemo(() => 
    highlightedField === field.name || highlightedField === `field_${field.id}`,
    [highlightedField, field.name, field.id]
  );

  const fieldTypeOptions = useMemo(() => [
    { value: 'text', label: 'Text' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'textarea', label: 'Long Text' },
    { value: 'table', label: 'Table/List' }
  ], []);

  const renderValueInput = useMemo(() => {
    const baseClassName = `transition-all duration-300 ${
      isHighlighted ? 'ring-2 ring-blue-500 bg-blue-500/5' : ''
    }`;

    switch (field.type) {
      case 'table': {
        const tableData: TableData = field.value || { columns: [], rows: [] };
        return (
          <div className="space-y-4">
            {tableData.columns.length === 0 ? (
              <ShoppingListTemplate
                onApplyTemplate={(newTableData) => onUpdateField(field.id, 'value', newTableData)}
              />
            ) : isFillMode ? (
              <EnhancedTableFillMode
                value={tableData}
                onChange={(newTableData) => onUpdateField(field.id, 'value', newTableData)}
                isVoiceActive={isVoiceActive}
                highlightedCell={isHighlighted ? { rowIndex: 0, columnId: tableData.columns[0]?.id || '' } : null}
              />
            ) : (
              <TableFieldEditor
                value={tableData}
                onChange={(newTableData) => onUpdateField(field.id, 'value', newTableData)}
              />
            )}
          </div>
        );
      }
      case 'textarea':
        return (
          <Textarea
            placeholder="Enter value..."
            value={field.value || ''}
            onChange={(e) => onUpdateField(field.id, 'value', e.target.value)}
            className={baseClassName}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            placeholder="Enter number..."
            value={field.value || ''}
            onChange={(e) => onUpdateField(field.id, 'value', e.target.value)}
            className={baseClassName}
          />
        );
      case 'date':
        return (
          <Input
            type="date"
            value={field.value || ''}
            onChange={(e) => onUpdateField(field.id, 'value', e.target.value)}
            className={baseClassName}
          />
        );
      default:
        return (
          <Input
            type="text"
            placeholder="Enter value..."
            value={field.value || ''}
            onChange={(e) => onUpdateField(field.id, 'value', e.target.value)}
            className={baseClassName}
          />
        );
    }
  }, [field.type, field.value, field.id, onUpdateField, isHighlighted, isFillMode, isVoiceActive]);

  return (
    <div className={`space-y-2 p-3 border border-border rounded-lg transition-all duration-300 ${
      isHighlighted ? 'bg-blue-500/5 border-blue-500 animate-pulse' : 'bg-card'
    }`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Field name"
              value={field.name}
              onChange={(e) => onUpdateField(field.id, 'name', e.target.value)}
              disabled={isFillMode}
              className={`flex-1 transition-all duration-300 ${
                isHighlighted ? 'ring-2 ring-blue-500' : ''
              }`}
            />
            {isEditMode && (
              <Select
                value={field.type}
                onValueChange={(value) => onUpdateField(field.id, 'type', value)}
                disabled={isFillMode}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fieldTypeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          
          {renderValueInput}
        </div>
        
        {isEditMode && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onRemoveField(field.id)}
            className="p-2 text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {isVoiceActive && isHighlighted && (
        <div className="text-xs text-blue-500 animate-pulse flex items-center gap-1">
          <span>🎤</span>
          <span>Voice input active for this field</span>
        </div>
      )}
    </div>
  );
});

OptimizedCustomFieldItem.displayName = 'OptimizedCustomFieldItem';