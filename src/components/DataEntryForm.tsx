
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SavedEntry } from "@/pages/Dashboard";

interface DataEntryFormProps {
  onSave: (entry: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'textarea';
  value: any;
}

export const DataEntryForm: React.FC<DataEntryFormProps> = ({ onSave, onCancel }) => {
  const [title, setTitle] = useState("");
  const [fields, setFields] = useState<CustomField[]>([
    { id: '1', name: 'Description', type: 'textarea', value: '' }
  ]);

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
    fields.forEach(field => {
      if (field.name && field.value) {
        fieldData[field.name] = field.value;
      }
    });

    onSave({
      title: title || 'Untitled Entry',
      fields: fieldData
    });
  };

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
          <Label className="text-lg font-semibold">Custom Fields</Label>
          <Button type="button" onClick={addField} variant="outline" size="sm">
            Add Field
          </Button>
        </div>

        {fields.map((field, index) => (
          <div key={field.id} className="p-4 border rounded-lg space-y-3">
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

            <div className="space-y-2">
              <Label>Value</Label>
              {field.type === 'textarea' ? (
                <Textarea
                  placeholder="Enter the value..."
                  value={field.value}
                  onChange={(e) => updateField(field.id, 'value', e.target.value)}
                />
              ) : (
                <Input
                  type={field.type}
                  placeholder="Enter the value..."
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
          Save Entry
        </Button>
      </div>
    </form>
  );
};
