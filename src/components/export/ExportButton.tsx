import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SavedEntry } from "@/types/dashboard";
import { ExportModal } from "./ExportModal";
import { exportEntries, getExportFormatIcon, getExportFormatName } from "@/utils/exportUtils";
import { printEntries, openPrintPreview } from "@/utils/printUtils";
import { Download, FileText, Printer, Eye, ChevronDown } from "lucide-react";
import { toast } from "sonner";

interface ExportButtonProps {
  entries: SavedEntry[];
  selectedEntries?: string[];
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  showLabel?: boolean;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  entries,
  selectedEntries = [],
  variant = "outline",
  size = "default",
  showLabel = true,
}) => {
  const [showExportModal, setShowExportModal] = useState(false);

  const entriesToExport = selectedEntries.length > 0 
    ? entries.filter(entry => selectedEntries.includes(entry.id))
    : entries;

  const handleQuickExport = async (format: 'csv' | 'json' | 'pdf') => {
    if (entriesToExport.length === 0) {
      toast.error("No entries to export");
      return;
    }

    try {
      await exportEntries(entriesToExport, {
        format,
        filename: 'form-data',
        includeMetadata: true,
      });
      
      toast.success(`Successfully exported ${entriesToExport.length} entries as ${getExportFormatName(format)}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export entries');
    }
  };

  const handleQuickPrint = () => {
    if (entriesToExport.length === 0) {
      toast.error("No entries to print");
      return;
    }

    printEntries(entriesToExport, {
      includeMetadata: true,
      pageBreakBetweenEntries: false,
      fontSize: 'medium'
    });
    
    toast.success(`Sent ${entriesToExport.length} entries to printer`);
  };

  const handlePrintPreview = () => {
    if (entriesToExport.length === 0) {
      toast.error("No entries to preview");
      return;
    }

    openPrintPreview(entriesToExport, {
      includeMetadata: true,
      pageBreakBetweenEntries: false,
      fontSize: 'medium'
    });
  };

  const isDisabled = entriesToExport.length === 0;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size} disabled={isDisabled}>
            <Download className="h-4 w-4" />
            {showLabel && <span className="ml-2">Export</span>}
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-3 py-2 text-sm font-medium border-b">
            Quick Actions
          </div>
          
          <DropdownMenuItem onClick={() => handleQuickExport('csv')}>
            <span className="mr-2">{getExportFormatIcon('csv')}</span>
            Export as CSV
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleQuickExport('json')}>
            <span className="mr-2">{getExportFormatIcon('json')}</span>
            Export as JSON
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleQuickExport('pdf')}>
            <span className="mr-2">{getExportFormatIcon('pdf')}</span>
            Export as PDF
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handlePrintPreview}>
            <Eye className="h-4 w-4 mr-2" />
            Print Preview
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleQuickPrint}>
            <Printer className="h-4 w-4 mr-2" />
            Quick Print
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => setShowExportModal(true)}>
            <FileText className="h-4 w-4 mr-2" />
            More Options...
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ExportModal
        open={showExportModal}
        onClose={() => setShowExportModal(false)}
        entries={entries}
        selectedEntries={selectedEntries}
      />
    </>
  );
};