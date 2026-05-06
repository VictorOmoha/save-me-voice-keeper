
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SavedEntry } from "@/types/dashboard";
import { Edit, FileText, Download, Eye, Printer, Copy } from "lucide-react";
import { getCategoryIcon, getCategoryColor, getCategoryName, getEntryType } from "./categoryUtils";
import { toast } from "sonner";
import { ImageGallery } from "@/components/forms/ImageGallery";
import { extractImagesFromEntry } from "@/utils/imageUtils";
import { printProfessionally } from "@/components/entries/ProfessionalPrintView";
import { TableFieldViewer } from "@/components/forms/table/TableFieldViewer";
import { ShoppingListCardViewer } from "@/components/forms/table/ShoppingListCardViewer";
import { TableData } from "@/components/forms/types";
import { logVoice, logError } from "@/utils/logger";
import { EntryIntelligencePanel } from "@/components/entries/EntryIntelligencePanel";

interface EntryViewDialogProps {
  entry: SavedEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (entry: SavedEntry) => void;
  onFill?: (entry: SavedEntry) => void;
  onUseAsTemplate?: (entry: SavedEntry) => void;
  onViewDocument?: (entry: SavedEntry) => void;
  allEntries?: SavedEntry[];
  onOpenRelatedEntry?: (entry: SavedEntry) => void;
}

export const EntryViewDialog: React.FC<EntryViewDialogProps> = ({
  entry,
  isOpen,
  onClose,
  onEdit,
  onFill,
  onUseAsTemplate,
  onViewDocument,
  allEntries = [],
  onOpenRelatedEntry,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  // Listen for canonical Nova close event
  useEffect(() => {
    const handleCloseCommand = () => {
      if (isOpen) {
        logVoice('Nova close: Closing entry dialog');
        onClose();
      }
    };

    window.addEventListener('nova:close', handleCloseCommand);

    return () => {
      window.removeEventListener('nova:close', handleCloseCommand);
    };
  }, [isOpen, onClose]);

  if (!entry) return null;

  const Icon = getCategoryIcon(entry);
  const categoryColor = getCategoryColor(entry);
  const categoryName = getCategoryName(entry);
  const entryType = getEntryType(entry);
  
  // Extract images from the entry
  const entryImages = extractImagesFromEntry(entry);
  
  // Check if this is a document entry with an uploaded file
  const isDocumentWithFile = entry.fields.category === 'Documents' && entry.fields.hasUploadedFile;

  const handleDownload = async () => {
    if (!entry.fields.hasUploadedFile || !entry.fields.fileName) {
      toast.error("No file available for download");
      return;
    }

    setIsDownloading(true);
    
    try {
      // Search for the file data in localStorage
      const allKeys = Object.keys(localStorage);
      const documentKeys = allKeys.filter(key => key.startsWith('document_'));
      
      let fileData = null;
      for (const key of documentKeys) {
        try {
          const storedData = JSON.parse(localStorage.getItem(key) || '');
          if (storedData.name === entry.fields.fileName) {
            fileData = storedData;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!fileData) {
        toast.error("File data not found in storage");
        return;
      }

      // Create download link
      const link = document.createElement('a');
      link.href = fileData.data;
      link.download = fileData.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Downloaded ${fileData.name}`);
    } catch (error) {
      logError('Download error', error);
      toast.error("Failed to download file");
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    printProfessionally([entry], { title: entry.title, includeMetadata: true });
    toast.success("Print dialog opened");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg ${categoryColor} flex items-center justify-center flex-shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-semibold">
                {entry.title}
              </DialogTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {categoryName}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {entryType}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Entry Metadata */}
          <div className="flex items-center justify-between text-sm text-muted-foreground border-b pb-4">
            <div>
              <p>Created: {new Date(entry.createdAt).toLocaleDateString()}</p>
              <p>Last Modified: {new Date(entry.updatedAt).toLocaleDateString()}</p>
            </div>
            {entry.fields.hasUploadedFile && entry.fields.fileName && (
              <div className="flex items-center space-x-2 text-sm">
                <FileText className="w-4 h-4" />
                <span>{entry.fields.fileName}</span>
                <span className="text-muted-foreground">
                  ({entry.fields.fileSize ? `${(entry.fields.fileSize / 1024).toFixed(1)} KB` : 'Unknown size'})
                </span>
              </div>
            )}
          </div>

          {/* Images Gallery */}
          {entryImages.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">Images</h3>
              <ImageGallery images={entryImages} readOnly={true} />
            </div>
          )}

          <EntryIntelligencePanel
            entry={entry}
            allEntries={allEntries}
            onOpenEntry={onOpenRelatedEntry}
          />

          {/* Entry Fields */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground">Entry Details</h3>
            <div className="grid gap-4">
              {Object.entries(entry.fields)
                .filter(([key, value]) => {
                  // Skip file metadata fields
                  if (['hasUploadedFile', 'fileName', 'fileSize', 'fileType'].includes(key)) {
                    return false;
                  }
                  // Skip image fields that are already shown in the gallery
                  if (entryImages.includes(String(value)) || 
                      (Array.isArray(value) && value.some(v => entryImages.includes(String(v))))) {
                    return false;
                  }
                  return true;
                })
                .map(([key, value]) => {
                  // Handle table fields separately
                  if (typeof value === 'object' && value !== null && 'columns' in value && 'rows' in value) {
                    const tableData = value as TableData;
                    
                    // Check if this is a shopping list by looking for common shopping list columns
                    const isShoppingList = tableData.columns.some(col => 
                      ['item', 'quantity', 'price', 'cost', 'purchased', 'got it'].some(term => 
                        col.name.toLowerCase().includes(term)
                      )
                    );
                    
                    return (
                      <div key={key} className="space-y-3">
                        <label className="text-sm font-medium text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </label>
                        {isShoppingList ? (
                          <ShoppingListCardViewer
                            value={tableData}
                            title={key}
                            showExport={true}
                          />
                        ) : (
                          <TableFieldViewer
                            value={tableData}
                            title={key}
                            showExport={true}
                          />
                        )}
                      </div>
                    );
                  }
                  
                  // Handle regular fields
                  return (
                    <div key={key} className="space-y-1">
                      <label className="text-sm font-medium text-muted-foreground capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      <div className="p-3 bg-accent/50 rounded-md border">
                        <p className="text-foreground whitespace-pre-wrap">
                          {String(value) || 'No details added yet'}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            {isDocumentWithFile && onViewDocument && (
              <Button
                onClick={() => {
                  onViewDocument(entry);
                  onClose();
                }}
                variant="outline"
                className="text-primary hover:text-primary/80"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Document
              </Button>
            )}
            {entry.fields.hasUploadedFile && entry.fields.fileName && (
              <Button
                onClick={handleDownload}
                variant="outline"
                disabled={isDownloading}
                className="text-green-600 hover:text-green-700"
              >
                <Download className="h-4 w-4 mr-2" />
                {isDownloading ? 'Downloading...' : 'Download File'}
              </Button>
            )}
            <Button
              onClick={handlePrint}
              variant="outline"
              className="text-purple-600 hover:text-purple-700"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Entry
            </Button>
            {onFill && (
              <Button
                onClick={() => {
                  onFill(entry);
                  onClose();
                }}
                variant="outline"
                className="text-green-600 hover:text-green-700"
              >
                <FileText className="h-4 w-4 mr-2" />
                Fill Form
              </Button>
            )}
            {onUseAsTemplate && (
              <Button
                onClick={() => {
                  onUseAsTemplate(entry);
                  onClose();
                }}
                variant="outline"
                className="text-purple-600 hover:text-purple-700"
              >
                <Copy className="h-4 w-4 mr-2" />
                Use as Template
              </Button>
            )}
            {onEdit && (
              <Button
                onClick={() => {
                  onEdit(entry);
                  onClose();
                }}
                variant="outline"
                className="text-blue-600 hover:text-blue-700"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Entry
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
