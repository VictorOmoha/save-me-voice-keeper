import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SavedEntry } from "@/types/dashboard";
import { ExportFormat, exportEntries, getExportFormatIcon, getExportFormatName } from "@/utils/exportUtils";
import { printEntries, openPrintPreview, PrintOptions } from "@/utils/printUtils";
import { Download, FileText, Printer, Eye } from "lucide-react";
import { toast } from "sonner";

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  entries: SavedEntry[];
  selectedEntries?: string[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  open,
  onClose,
  entries,
  selectedEntries = [],
}) => {
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [filename, setFilename] = useState('form-data');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [printOptions, setPrintOptions] = useState<PrintOptions>({
    includeMetadata: true,
    pageBreakBetweenEntries: false,
    fontSize: 'medium'
  });

  const entriesToExport = selectedEntries.length > 0 
    ? entries.filter(entry => selectedEntries.includes(entry.id))
    : entries;

  const handleExport = async () => {
    if (entriesToExport.length === 0) {
      toast.error("No entries to export");
      return;
    }

    setIsExporting(true);
    
    try {
      await exportEntries(entriesToExport, {
        format: exportFormat,
        filename,
        includeMetadata,
      });
      
      toast.success(`Successfully exported ${entriesToExport.length} entries as ${getExportFormatName(exportFormat)}`);
      onClose();
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export entries');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    if (entriesToExport.length === 0) {
      toast.error("No entries to print");
      return;
    }

    printEntries(entriesToExport, printOptions);
    toast.success(`Sent ${entriesToExport.length} entries to printer`);
  };

  const handlePrintPreview = () => {
    if (entriesToExport.length === 0) {
      toast.error("No entries to preview");
      return;
    }

    openPrintPreview(entriesToExport, printOptions);
  };

  const exportFormats: { value: ExportFormat; label: string; description: string }[] = [
    { value: 'csv', label: 'CSV', description: 'Comma-separated values, perfect for spreadsheets' },
    { value: 'json', label: 'JSON', description: 'JavaScript Object Notation, ideal for data processing' },
    { value: 'pdf', label: 'PDF', description: 'Portable Document Format, great for sharing and printing' },
    { value: 'excel', label: 'Excel', description: 'Microsoft Excel format with enhanced formatting' },
    { value: 'html', label: 'HTML', description: 'Web page format, viewable in any browser' },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export & Print Options
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Summary */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">Ready to export</p>
              <p className="text-sm text-muted-foreground">
                {entriesToExport.length} {entriesToExport.length === 1 ? 'entry' : 'entries'} selected
              </p>
            </div>
            <Badge variant="secondary">
              {selectedEntries.length > 0 ? 'Selected Items' : 'All Items'}
            </Badge>
          </div>

          {/* Export Format Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Export Format</Label>
            <RadioGroup value={exportFormat} onValueChange={(value: ExportFormat) => setExportFormat(value)}>
              {exportFormats.map((format) => (
                <div key={format.value} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value={format.value} id={format.value} />
                  <div className="flex-1">
                    <Label htmlFor={format.value} className="flex items-center gap-2 cursor-pointer">
                      <span className="text-lg">{getExportFormatIcon(format.value)}</span>
                      <span className="font-medium">{format.label}</span>
                    </Label>
                    <p className="text-sm text-muted-foreground mt-1">{format.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Export Options */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Export Options</Label>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="filename">Filename</Label>
                <Input
                  id="filename"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder="Enter filename"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-metadata"
                  checked={includeMetadata}
                  onCheckedChange={(checked) => setIncludeMetadata(checked as boolean)}
                />
                <Label htmlFor="include-metadata">
                  Include metadata (creation date, last modified, etc.)
                </Label>
              </div>
            </div>
          </div>

          {/* Print Options */}
          <div className="space-y-4 border-t pt-4">
            <Label className="text-base font-medium flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Print Options
            </Label>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="font-size">Font Size</Label>
                <Select
                  value={printOptions.fontSize}
                  onValueChange={(value: 'small' | 'medium' | 'large') => 
                    setPrintOptions(prev => ({ ...prev, fontSize: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Small</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="print-metadata"
                    checked={printOptions.includeMetadata}
                    onCheckedChange={(checked) => 
                      setPrintOptions(prev => ({ ...prev, includeMetadata: checked as boolean }))
                    }
                  />
                  <Label htmlFor="print-metadata">Include metadata</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="page-breaks"
                    checked={printOptions.pageBreakBetweenEntries}
                    onCheckedChange={(checked) => 
                      setPrintOptions(prev => ({ ...prev, pageBreakBetweenEntries: checked as boolean }))
                    }
                  />
                  <Label htmlFor="page-breaks">Page break between entries</Label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={handlePrintPreview}
            disabled={entriesToExport.length === 0}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          
          <Button
            variant="outline"
            onClick={handlePrint}
            disabled={entriesToExport.length === 0}
          >
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          
          <Button
            onClick={handleExport}
            disabled={isExporting || entriesToExport.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};