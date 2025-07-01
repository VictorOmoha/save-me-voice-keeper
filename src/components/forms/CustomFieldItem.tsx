
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CustomField } from './types';

interface CustomFieldItemProps {
  field: CustomField;
  index: number;
  fieldsLength: number;
  isEditMode: boolean;
  isFillMode: boolean;
  onUpdateField: (id: string, key: keyof CustomField, value: any) => void;
  onRemoveField: (id: string) => void;
}

export const CustomFieldItem: React.FC<CustomFieldItemProps> = ({
  field,
  index,
  fieldsLength,
  isEditMode,
  isFillMode,
  onUpdateField,
  onRemoveField
}) => {
  return (
    <div className="p-4 border border-border rounded-lg space-y-3 bg-card">
      {isEditMode && (
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-foreground">Field {index + 1}</h4>
          {fieldsLength > 1 && (
            <Button 
              type="button" 
              onClick={() => onRemoveField(field.id)}
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
            <Label className="text-foreground">Field Name</Label>
            <Input
              placeholder="e.g., Medication Name, Dosage, Policy Number"
              value={field.name}
              onChange={(e) => onUpdateField(field.id, 'name', e.target.value)}
              className="bg-background border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-foreground">Field Type</Label>
            <Select value={field.type} onValueChange={(value) => onUpdateField(field.id, 'type', value)}>
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                <SelectItem value="text" className="text-foreground hover:bg-accent">Text</SelectItem>
                <SelectItem value="number" className="text-foreground hover:bg-accent">Number</SelectItem>
                <SelectItem value="date" className="text-foreground hover:bg-accent">Date</SelectItem>
                <SelectItem value="textarea" className="text-foreground hover:bg-accent">Long Text</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <Label className="font-medium text-foreground">{field.name}</Label>
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-foreground">{isFillMode ? 'Enter Data' : 'Value'}</Label>
        {field.type === 'textarea' ? (
          <Textarea
            placeholder={isFillMode ? `Enter ${field.name}...` : "Enter the value..."}
            value={field.value}
            onChange={(e) => onUpdateField(field.id, 'value', e.target.value)}
            className="bg-background border-border text-foreground placeholder:text-muted-foreground"
          />
        ) : (
          <Input
            type={field.type}
            placeholder={isFillMode ? `Enter ${field.name}...` : "Enter the value..."}
            value={field.value}
            onChange={(e) => onUpdateField(field.id, 'value', e.target.value)}
            className="bg-background border-border text-foreground placeholder:text-muted-foreground"
          />
        )}
      </div>
    </div>
  );
};
