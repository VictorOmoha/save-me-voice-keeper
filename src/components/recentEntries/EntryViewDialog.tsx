import {useDownload} from '@/components/categoryView/useDownload';
import {metadataFields} from '@/utils/fieldFormatters';

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
import { fieldValueToText } from "@/utils/fieldValueGuards";

const isTableDataValue = (value: unknown): value is TableData =>
  typeof value === 'object' &&
  value !== null &&
  'columns' in value &&
  'rows' in value;

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
  const {downloadingFiles, handleDownload: downloadEntry} = useDownload();
  const isDownloading = !!entry && downloadingFiles.includes(entry.id);

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
  const displayFields = Object.entries(entry.fields).filter(([key, value]) => {
    if (metadataFields.includes(key)) return false;
    if (['category', 'hasUploadedFile', 'fileName', 'fileSize', 'fileType'].includes(key)) return false;
    if (entryImages.includes(String(value)) || (Array.isArray(value) && value.some(v => entryImages.includes(String(v))))) return false;
    if (value === null || value === undefined || value === '') return false;
    if (isTableDataValue(value)) {
      return Array.isArray(value.rows) && value.rows.length > 0;
    }
    return true;
  });
  const hasMeaningfulDetails = displayFields.length > 0 || entryImages.length > 0 || Boolean(entry.fields.hasUploadedFile && entry.fields.fileName);
  
  // Check if this is a document entry with an uploaded file
  const isDocumentWithFile = entry.fields.category === 'Documents' && entry.fields.hasUploadedFile;

  const handleDownload = () => downloadEntry(entry);

  const handlePrint = () => {
    if (!hasMeaningfulDetails) {
      toast.error("Add details before printing this entry.");
      return;
    }
    printProfessionally([entry], { title: entry.title, includeMetadata: true });
    toast.success("Print dialog opened");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="workspace-shell w-[calc(100%-2rem)] max-w-2xl max-h-[90dvh] overflow-y-auto rounded-2xl p-5 sm:p-7">
        <DialogHeader className="pr-8 text-left">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg ${categoryColor} flex items-center justify-center flex-shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-xl font-semibold">
                {entry.title}
              </DialogTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {categoryName}
                </Badge>

              </div>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Entry Metadata */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground border-b pb-4">
            <div>
              <p>Created: {new Date(entry.createdAt).toLocaleDateString()}</p>
              <p>Last Modified: {new Date(entry.updatedAt).toLocaleDateString()}</p>
            </div>
            {entry.fields.hasUploadedFile && entry.fields.fileName && (
              <div className="flex items-center space-x-2 text-sm">
                <FileText className="w-4 h-4" />
                <span>{fieldValueToText(entry.fields.fileName)}</span>
                <span className="text-muted-foreground">
                  ({typeof entry.fields.fileSize === 'number' && entry.fields.fileSize ? `${(entry.fields.fileSize / 1024).toFixed(1)} KB` : 'Unknown size'})
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
            <h3 className="text-lg font-medium text-foreground">Details</h3>
            <div className="grid gap-4">
              {!hasMeaningfulDetails && (
                <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                  Saved as-is. No extra details have been added yet, but your original memory is safe in the archive.
                </div>
              )}
              {displayFields
                .map(([key, value]) => {
                  // Handle table fields separately
                  if (isTableDataValue(value)) {
                    const tableData: TableData = value;
                    
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
                        <p className="text-foreground whitespace-pre-wrap break-words">
                          {String(value)}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-end gap-2 pt-4 border-t">
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
                className="text-foreground"
              >
                <Download className="h-4 w-4 mr-2" />
                {isDownloading ? 'Downloading...' : 'Download File'}
              </Button>
            )}
            <Button
              onClick={handlePrint}
              variant="outline"
              disabled={!hasMeaningfulDetails}
              title={!hasMeaningfulDetails ? "Add details before printing" : "Print entry"}
              className="text-foreground"
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
                disabled={!hasMeaningfulDetails}
                title={!hasMeaningfulDetails ? "Add details before filling this form" : "Fill form"}
                className="text-foreground"
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
                disabled={!hasMeaningfulDetails}
                title={!hasMeaningfulDetails ? "Add details before using this as a template" : "Use as template"}
                className="text-foreground"
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
