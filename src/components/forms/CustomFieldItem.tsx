
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import { CustomField } from './types';
import { ImageUpload } from './ImageUpload';
import { ImageGallery } from './ImageGallery';

interface CustomFieldItemProps {
  field: CustomField;
  index: number;
  fieldsLength: number;
  isEditMode: boolean;
  isFillMode: boolean;
  onUpdateField: (id: string, key: keyof CustomField, value: any) => void;
  onRemoveField: (id: string) => void;
  onMoveField?: (id: string, direction: 'up' | 'down') => void;
}

export const CustomFieldItem: React.FC<CustomFieldItemProps> = ({
  field,
  index,
  fieldsLength,
  isEditMode,
  isFillMode,
  onUpdateField,
  onRemoveField,
  onMoveField
}) => {
  const canMoveUp = index > 0;
  const canMoveDown = index < fieldsLength - 1;

  console.log('CustomFieldItem render:', {
    fieldName: field.name,
    fieldValue: field.value,
    fieldType: field.type,
    isEditMode,
    isFillMode
  });

  const renderFieldInput = () => {
    if (isFillMode) {
      // In fill mode, show the appropriate input based on field type
      switch (field.type) {
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
              {field.value && field.value.length > 0 && (
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
          <div>
            <Label className="text-foreground">Field Name</Label>
            <Input
              placeholder="Enter field name..."
              value={field.name}
              onChange={(e) => onUpdateField(field.id, 'name', e.target.value)}
              className="bg-background border-border text-foreground"
            />
          </div>
          <div>
            <Label className="text-foreground">Field Type</Label>
            <Select value={field.type} onValueChange={(value) => onUpdateField(field.id, 'type', value)}>
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="textarea">Long Text</SelectItem>
                <SelectItem value="image">Single Image</SelectItem>
                <SelectItem value="gallery">Image Gallery</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Show current value in edit mode for reference */}
          {field.value && (
            <div>
              <Label className="text-foreground text-sm text-muted-foreground">Current Value</Label>
              <div className="p-2 bg-muted rounded text-sm">
                {Array.isArray(field.value) ? field.value.join(', ') : String(field.value)}
              </div>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className="p-4 border border-border rounded-lg bg-card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {!isFillMode && (
            <Label className="text-foreground font-medium mb-2 block">
              Field {index + 1}
            </Label>
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
