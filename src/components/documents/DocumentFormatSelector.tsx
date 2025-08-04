import { FileText, File, Image, Type, FileCheck } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export type DocumentFormat = 'docx' | 'pdf' | 'rtf' | 'txt' | 'html';

interface DocumentFormatSelectorProps {
  selectedFormat: DocumentFormat | '';
  onFormatChange: (format: DocumentFormat) => void;
}

export const DocumentFormatSelector: React.FC<DocumentFormatSelectorProps> = ({
  selectedFormat,
  onFormatChange,
}) => {
  const formats = [
    {
      value: 'docx' as const,
      label: 'Word Document (.docx)',
      icon: FileText,
      description: 'Rich text document with formatting'
    },
    {
      value: 'pdf' as const,
      label: 'PDF Document (.pdf)',
      icon: File,
      description: 'Portable document format'
    },
    {
      value: 'rtf' as const,
      label: 'Rich Text Format (.rtf)',
      icon: FileCheck,
      description: 'Cross-platform rich text format'
    },
    {
      value: 'txt' as const,
      label: 'Plain Text (.txt)',
      icon: Type,
      description: 'Simple text document'
    },
    {
      value: 'html' as const,
      label: 'HTML Document (.html)',
      icon: Image,
      description: 'Web document format'
    }
  ];

  return (
    <div className="space-y-2">
      <Label className="text-foreground">Document Format</Label>
      <Select value={selectedFormat} onValueChange={onFormatChange}>
        <SelectTrigger className="bg-background border-border text-foreground">
          <SelectValue placeholder="Choose document format" />
        </SelectTrigger>
        <SelectContent className="bg-background border-border">
          {formats.map((format) => {
            const Icon = format.icon;
            return (
              <SelectItem 
                key={format.value} 
                value={format.value}
                className="text-foreground hover:bg-accent"
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4" />
                  <div>
                    <div className="font-medium">{format.label}</div>
                    <div className="text-xs text-muted-foreground">{format.description}</div>
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
};