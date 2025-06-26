
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SavedEntry, FieldDefinition } from "@/pages/Dashboard";

interface DataEntryFormProps {
  onSave: (entry: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  editEntry?: SavedEntry | null;
  templateEntry?: SavedEntry | null;
  mode?: 'create' | 'edit' | 'fill';
}

interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'textarea';
  value: any;
}

export const DataEntryForm: React.FC<DataEntryFormProps> = ({ 
  onSave, 
  onCancel, 
  editEntry, 
  templateEntry,
  mode = 'create'
}) => {
  const [title, setTitle] = useState("");
  const [fields, setFields] = useState<CustomField[]>([
    { id: '1', name: 'Description', type: 'textarea', value: '' }
  ]);

  useEffect(() => {
    if (editEntry) {
      setTitle(editEntry.title);
      // Use fieldDefinitions if available, otherwise fall back to fields
      if (editEntry.fieldDefinitions && editEntry.fieldDefinitions.length > 0) {
        const editFields: CustomField[] = editEntry.fieldDefinitions.map(fieldDef => ({
          ...fieldDef,
          value: editEntry.fields[fieldDef.name] || ''
        }));
        setFields(editFields);
      } else {
        const editFields: CustomField[] = Object.entries(editEntry.fields).map(([name, value], index) => ({
          id: (index + 1).toString(),
          name,
          type: typeof value === 'number' ? 'number' : 'text',
          value
        }));
        setFields(editFields.length > 0 ? editFields : [{ id: '1', name: 'Description', type: 'textarea', value: '' }]);
      }
    } else if (templateEntry && mode === 'fill') {
      setTitle(`${templateEntry.title} - ${new Date().toLocaleDateString()}`);
      // Use fieldDefinitions to recreate the form structure
      if (templateEntry.fieldDefinitions && templateEntry.fieldDefinitions.length > 0) {
        const templateFields: CustomField[] = templateEntry.fieldDefinitions.map(fieldDef => ({
          ...fieldDef,
          value: '' // Clear values for new data entry
        }));
        setFields(templateFields);
      } else {
        // Fallback to old method if fieldDefinitions don't exist
        const templateFields: CustomField[] = Object.entries(templateEntry.fields).map(([name, value], index) => ({
          id: (index + 1).toString(),
          name,
          type: typeof value === 'number' ? 'number' : 'text',
          value: ''
        }));
        setFields(templateFields);
      }
    }
  }, [editEntry, templateEntry, mode]);

  const addField = () => {
    const newField: CustomField = {
      id: Date.now().toString(),
      name: '',
      type: 'text',
      value: ''
    };
    setFields([...fields, newField]);
  };

  const updateField = (id: string, key: keyof CustomField, value: any) => {
    setFields(fields.map(field => 
      field.id === id ? { ...field, [key]: value } : field
    ));
  };

  const removeField = (id: string) => {
    setFields(fields.filter(field => field.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const fieldData: Record<string, any> = {};
    const fieldDefinitions: FieldDefinition[] = [];
    
    fields.forEach(field => {
      if (field.name && field.value !== undefined) {
        fieldData[field.name] = field.value;
      }
      if (field.name) {
        fieldDefinitions.push({
          id: field.id,
          name: field.name,
          type: field.type
        });
      }
    });

    onSave({
      title: title || 'Untitled Entry',
      fields: fieldData,
      fieldDefinitions: fieldDefinitions
    });
  };

  const isEditMode = mode === 'edit' || mode === 'create';
  const isFillMode = mode === 'fill';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Entry Title</Label>
        <Input
          id="title"
          placeholder="Give your entry a title (e.g., 'Medication Info', 'Insurance Policy')"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-lg font-semibold">
            {isFillMode ? 'Fill in the Data' : 'Custom Fields'}
          </Label>
          {isEditMode && (
            <Button type="button" onClick={addField} variant="outline" size="sm">
              Add Field
            </Button>
          )}
        </div>

        {fields.map((field, index) => (
          <div key={field.id} className="p-4 border rounded-lg space-y-3">
            {isEditMode && (
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Field {index + 1}</h4>
                {fields.length > 1 && (
                  <Button 
                    type="button" 
                    onClick={() => removeField(field.id)}
                    variant="outline" 
                    size="sm"
                  >
                    Remove
                  </Button>
                )}
              </div>
            )}
            
            {isEditMode ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Field Name</Label>
                  <Input
                    placeholder="e.g., Medication Name, Dosage, Policy Number"
                    value={field.name}
                    onChange={(e) => updateField(field.id, 'name', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Field Type</Label>
                  <Select value={field.type} onValueChange={(value) => updateField(field.id, 'type', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="textarea">Long Text</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="font-medium">{field.name}</Label>
              </div>
            )}

            <div className="space-y-2">
              <Label>{isFillMode ? 'Enter Data' : 'Value'}</Label>
              {field.type === 'textarea' ? (
                <Textarea
                  placeholder={isFillMode ? `Enter ${field.name}...` : "Enter the value..."}
                  value={field.value}
                  onChange={(e) => updateField(field.id, 'value', e.target.value)}
                />
              ) : (
                <Input
                  type={field.type}
                  placeholder={isFillMode ? `Enter ${field.name}...` : "Enter the value..."}
                  value={field.value}
                  onChange={(e) => updateField(field.id, 'value', e.target.value)}
                />
              )}
            </div>
          </div>
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
  );
};
