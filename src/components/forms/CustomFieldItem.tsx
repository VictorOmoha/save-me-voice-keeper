
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, Trash2, Settings, Edit3, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { CustomField, TableData } from './types';
import { ImageUpload } from './ImageUpload';
import { ImageGallery } from './ImageGallery';
import { TableFieldEditor } from './table/TableFieldEditor';
import { TableFieldViewer } from './table/TableFieldViewer';
import { ShoppingListTemplate } from './table/ShoppingListTemplate';
import { EnhancedTableFillMode } from './table/EnhancedTableFillMode';
import { validateFieldName } from "@/utils/fieldNameNormalizer";

interface CustomFieldItemProps {
  field: CustomField;
  index: number;
  fieldsLength: number;
  isEditMode: boolean;
  isFillMode: boolean;
  onUpdateField: (id: string, key: keyof CustomField, value: any) => void;
  onRemoveField: (id: string) => void;
  onMoveField?: (id: string, direction: 'up' | 'down') => void;
  highlightedField?: string | null;
  isVoiceCreated?: boolean;
}

export const CustomFieldItem: React.FC<CustomFieldItemProps> = ({
  field,
  index,
  fieldsLength,
  isEditMode,
  isFillMode,
  onUpdateField,
  onRemoveField,
  onMoveField,
  highlightedField,
  isVoiceCreated
}) => {
  const canMoveUp = index > 0;
  const canMoveDown = index < fieldsLength - 1;

  // Normalize field type to handle legacy invalid types
  const validTypes: CustomField['type'][] = ['text', 'number', 'date', 'textarea', 'image', 'gallery', 'table'];
  const normalizedFieldType = validTypes.includes(field.type) ? field.type : 'text';
  
  // If field type was normalized, update it automatically
  if (normalizedFieldType !== field.type) {
    console.warn(`Invalid field type "${field.type}" detected for field "${field.name}". Converting to "text".`);
    onUpdateField(field.id, 'type', normalizedFieldType);
  }

  // State to track whether we're editing data or structure for table fields
  const [isEditingStructure, setIsEditingStructure] = useState(false);
  const [fieldNameValidation, setFieldNameValidation] = useState<{ isValid: boolean; error?: string; suggestion?: string }>({ isValid: true });

  // Validate field name whenever it changes
  useEffect(() => {
    if (isEditMode && field.name) {
      const validation = validateFieldName(field.name);
      setFieldNameValidation(validation);
    }
  }, [field.name, isEditMode]);
  
  // Detect table data structure regardless of field type
  const hasTableDataStructure = field.value && 
    typeof field.value === 'object' && 
    field.value.columns && 
    Array.isArray(field.value.columns) && 
    field.value.rows && 
    Array.isArray(field.value.rows);

  // For existing table fields with data, show data editor by default
  const hasTableData = (normalizedFieldType === 'table' && field.value && 
    (field.value.columns && Array.isArray(field.value.columns) && field.value.columns.length > 0)) || hasTableDataStructure;
  
  // Check if this is a field with table data that needs type conversion
  const needsTableConversion = hasTableDataStructure && normalizedFieldType !== 'table';
    
  // Show toggle buttons for any table field in edit mode that has some value
  const shouldShowToggle = isEditMode && (normalizedFieldType === 'table' || hasTableDataStructure) && 
    (hasTableData || needsTableConversion);
  
  // Determine if we should show data input or structure config
  const shouldShowDataInput = isFillMode || (isEditMode && (normalizedFieldType === 'table' || hasTableDataStructure) && (hasTableData || needsTableConversion) && !isEditingStructure);

  // Auto-convert field type if it has table data but wrong type
  useEffect(() => {
    if (needsTableConversion && field.type !== 'table') {
      console.log('Auto-converting field to table type:', field.name);
      onUpdateField(field.id, 'type', 'table');
    }
  }, [needsTableConversion, field.type, field.id, field.name, onUpdateField]);
  
  console.log('CustomFieldItem debug:', {
    fieldName: field.name,
    fieldType: field.type,
    isEditMode,
    hasTableData,
    needsTableConversion,
    shouldShowToggle,
    fieldValue: field.value
  });

  console.log('CustomFieldItem render:', {
    fieldName: field.name,
    fieldValue: field.value,
    fieldType: field.type,
    isEditMode,
    isFillMode
  });

  const renderFieldInput = () => {
    console.log('renderFieldInput called for field:', field.name, 'type:', field.type, 'value:', field.value);
    
    if (shouldShowDataInput) {
      // Show data input for filling or editing existing data
      switch (normalizedFieldType) {
        case 'table':
          // Initialize table data if not present or convert from simple value
          console.log('Processing table field, value:', field.value);
          let tableData: TableData;
          
          if (needsTableConversion) {
            // Convert simple string value to table structure
            tableData = {
              columns: [
                { id: 'item', name: 'Item', type: 'text' },
                { id: 'quantity', name: 'Quantity', type: 'number' }
              ],
              rows: [{ item: field.value, quantity: 1 }]
            };
            // Auto-save the converted structure
            onUpdateField(field.id, 'value', tableData);
          } else {
            tableData = field.value || { columns: [], rows: [] };
          }
          
          console.log('Table data after initialization:', tableData);
          console.log('Columns:', tableData.columns, 'Type:', typeof tableData.columns);
          
          return (
            <div className="space-y-4">
              {(tableData.columns && Array.isArray(tableData.columns) && tableData.columns.length === 0) ? (
                <ShoppingListTemplate
                  onApplyTemplate={(newTableData) => onUpdateField(field.id, 'value', newTableData)}
                />
              ) : isFillMode ? (
                <EnhancedTableFillMode
                  value={tableData}
                  onChange={(newTableData) => onUpdateField(field.id, 'value', newTableData)}
                  disabled={false}
                />
              ) : (
                <TableFieldEditor
                  value={tableData}
                  onChange={(newTableData) => onUpdateField(field.id, 'value', newTableData)}
                />
              )}
            </div>
          );
        case 'image':
          return (
            <div className="space-y-4">
              <ImageUpload
                value={field.value || ''}
                onChange={(value) => onUpdateField(field.id, 'value', value)}
                multiple={false}
                label=""
              />
              {field.value && (
                <ImageGallery images={[field.value]} readOnly={false} />
              )}
            </div>
          );
        case 'gallery':
          return (
            <div className="space-y-4">
              <ImageUpload
                value={field.value || []}
                onChange={(value) => onUpdateField(field.id, 'value', value)}
                multiple={true}
                label=""
              />
              {field.value && Array.isArray(field.value) && field.value.length > 0 && (
                <ImageGallery images={field.value} readOnly={false} />
              )}
            </div>
          );
        case 'textarea':
          return (
            <Textarea
              placeholder="Enter your text..."
              value={field.value || ''}
              onChange={(e) => onUpdateField(field.id, 'value', e.target.value)}
              className="bg-background border-border text-foreground"
            />
          );
        case 'date':
          return (
            <Input
              type="date"
              value={field.value || ''}
              onChange={(e) => onUpdateField(field.id, 'value', e.target.value)}
              className="bg-background border-border text-foreground"
            />
          );
        case 'number':
          return (
            <Input
              type="number"
              placeholder="Enter a number..."
              value={field.value || ''}
              onChange={(e) => onUpdateField(field.id, 'value', e.target.value)}
              className="bg-background border-border text-foreground"
            />
          );
        default:
          return (
            <Input
              type="text"
              placeholder="Enter your text..."
              value={field.value || ''}
              onChange={(e) => onUpdateField(field.id, 'value', e.target.value)}
              className="bg-background border-border text-foreground"
            />
          );
      }
    } else {
      // In edit mode, show field configuration
      return (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-foreground">Field Name</Label>
            <Input
              placeholder="Enter field name..."
              value={field.name}
              onChange={(e) => onUpdateField(field.id, 'name', e.target.value)}
              className={`bg-background border-border text-foreground ${
                !fieldNameValidation.isValid ? 'border-red-500 ring-1 ring-red-500/30' : ''
              }`}
            />
            {!fieldNameValidation.isValid && (
              <div className="flex items-start space-x-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-700 dark:text-red-300">{fieldNameValidation.error}</p>
                  {fieldNameValidation.suggestion && (
                    <button
                      onClick={() => onUpdateField(field.id, 'name', fieldNameValidation.suggestion)}
                      className="text-xs text-red-600 dark:text-red-400 underline mt-1 hover:no-underline"
                    >
                      Use "{fieldNameValidation.suggestion}" instead
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          <div>
            <Label className="text-foreground">Field Type</Label>
            <Select 
              value={normalizedFieldType} 
              onValueChange={(value: CustomField['type']) => {
                console.log('Field type changed to:', value);
                // Validate that the value is a valid field type
                const validTypes: CustomField['type'][] = ['text', 'number', 'date', 'textarea', 'image', 'gallery', 'table'];
                if (!validTypes.includes(value)) {
                  console.error('Invalid field type:', value);
                  return;
                }
                
                // Convert value when changing field type
                let newValue = field.value;
                if (value === 'table' && (typeof field.value === 'string' || !field.value || !field.value.columns)) {
                  // Convert to table structure
                  newValue = {
                    columns: [
                      { id: 'item', name: 'Item', type: 'text' },
                      { id: 'quantity', name: 'Quantity', type: 'number' }
                    ],
                    rows: field.value && typeof field.value === 'string' ? [{ item: field.value, quantity: 1 }] : []
                  };
                } else if (value !== 'table' && normalizedFieldType === 'table') {
                  // Convert from table to other type
                  newValue = field.value?.rows?.[0]?.item || '';
                }
                onUpdateField(field.id, 'type', value);
                onUpdateField(field.id, 'value', newValue);
              }}
            >
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue placeholder="Select field type" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border z-50">
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="textarea">Long Text</SelectItem>
                <SelectItem value="image">Single Image</SelectItem>
                <SelectItem value="gallery">Image Gallery</SelectItem>
                <SelectItem value="table">Table/List</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Show current value in edit mode for reference */}
          {field.value && (
            <div>
              <Label className="text-foreground text-sm text-muted-foreground">Current Value</Label>
              <div className="p-2 bg-muted rounded text-sm">
                {normalizedFieldType === 'table' ? (
                  (field.value && field.value.rows && Array.isArray(field.value.rows)) 
                    ? `Table with ${field.value.rows.length} rows` 
                    : 'Empty table'
                ) : (
                  Array.isArray(field.value) ? field.value.join(', ') : String(field.value)
                )}
              </div>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className={`p-4 border border-border rounded-lg bg-card transition-all duration-300 ${
      isVoiceCreated ? 'ring-2 ring-green-500/50 border-green-500/30 bg-green-500/5' : ''
    } ${highlightedField === 'field_type' && field.name ? 'ring-2 ring-blue-500/50 animate-pulse' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {!isFillMode && (
            <div className="flex items-center justify-between mb-2">
              <Label className="text-foreground font-medium">
                Field {index + 1}
              </Label>
              {/* Toggle buttons for table fields in edit mode */}
              {shouldShowToggle && (
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant={!isEditingStructure ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsEditingStructure(false)}
                    className="text-xs px-2 py-1"
                  >
                    <Edit3 className="h-3 w-3 mr-1" />
                    Edit Data
                  </Button>
                  <Button
                    type="button"
                    variant={isEditingStructure ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsEditingStructure(true)}
                    className="text-xs px-2 py-1"
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    Edit Structure
                  </Button>
                </div>
              )}
            </div>
          )}
          {isFillMode && field.name && (
            <Label className="text-foreground font-medium mb-2 block">
              {field.name}
            </Label>
          )}
          {renderFieldInput()}
        </div>
        
        {isEditMode && (
          <div className="flex flex-col space-y-1 ml-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onMoveField?.(field.id, 'up')}
              disabled={!canMoveUp}
              className="p-1"
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onMoveField?.(field.id, 'down')}
              disabled={!canMoveDown}
              className="p-1"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => onRemoveField(field.id)}
              className="p-1"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
