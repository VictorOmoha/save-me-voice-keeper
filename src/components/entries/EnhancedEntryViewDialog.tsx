import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { SavedEntry } from "@/types/dashboard";
import {
  FileText,
  Calendar,
  Clock,
  Edit,
  Download,
  Eye,
  Printer,
  Copy,
  Phone,
  Tag,
  ExternalLink,
  X
} from "lucide-react";
import { toast } from "sonner";
import { ImageGallery } from "@/components/forms/ImageGallery";
import { extractImagesFromEntry } from "@/utils/imageUtils";
import { printProfessionally } from "@/components/entries/ProfessionalPrintView";
import { TableFieldViewer } from "@/components/forms/table/TableFieldViewer";
import { ShoppingListCardViewer } from "@/components/forms/table/ShoppingListCardViewer";
import { TableData } from "@/components/forms/types";
import { cn } from "@/lib/utils";
import { getCategoryConfig } from "@/utils/categoryConfig";
import { formatContextualFieldName, formatFieldName, metadataFields } from "@/utils/fieldFormatters";
import { logError } from "@/utils/logger";
import { EntryIntelligencePanel } from "@/components/entries/EntryIntelligencePanel";

interface EnhancedEntryViewDialogProps {
  entry: SavedEntry | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (entry: SavedEntry) => void;
  onFill?: (entry: SavedEntry) => void;
  onUseAsTemplate?: (entry: SavedEntry) => void;
  onViewDocument?: (entry: SavedEntry) => void;
  onPrint?: (entry: SavedEntry) => void;
  allEntries?: SavedEntry[];
  onOpenRelatedEntry?: (entry: SavedEntry) => void;
}


// Format field value for display
const formatFieldValue = (key: string, value: unknown): { formatted: string; type: "text" | "date" | "currency" | "phone" | "masked" | "email" | "url" } => {
  if (value === null || value === undefined || value === "") {
    return { formatted: "—", type: "text" };
  }

  // Handle file size
  if (key.toLowerCase().includes("size") && typeof value === "number") {
    if (value < 1024) return { formatted: `${value} B`, type: "text" };
    if (value < 1024 * 1024) return { formatted: `${(value / 1024).toFixed(1)} KB`, type: "text" };
    return { formatted: `${(value / (1024 * 1024)).toFixed(1)} MB`, type: "text" };
  }

  // Handle dates
  if (key.toLowerCase().includes("date") || key.toLowerCase().includes("expir") || key.toLowerCase().includes("appointment")) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      const formatted = date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      });
      return { formatted, type: "date" };
    }
  }

  // Handle phone numbers
  if (key.toLowerCase().includes("phone") || key.toLowerCase().includes("mobile") || key.toLowerCase().includes("tel")) {
    const cleaned = String(value).replace(/\D/g, "");
    if (cleaned.length === 10) {
      return { formatted: `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`, type: "phone" };
    }
    if (cleaned.length === 11 && cleaned[0] === "1") {
      return { formatted: `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`, type: "phone" };
    }
    return { formatted: String(value), type: "phone" };
  }

  // Handle email
  if (key.toLowerCase().includes("email")) {
    return { formatted: String(value), type: "email" };
  }

  // Handle URLs
  if (key.toLowerCase().includes("url") || key.toLowerCase().includes("website") || key.toLowerCase().includes("link")) {
    return { formatted: String(value), type: "url" };
  }

  // Handle currency
  if (key.toLowerCase().includes("balance") || key.toLowerCase().includes("amount") ||
      key.toLowerCase().includes("price") || key.toLowerCase().includes("cost") ||
      key.toLowerCase().includes("premium")) {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      const formatted = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num);
      return { formatted, type: "currency" };
    }
  }

  // Handle card/account numbers (mask them)
  if (key.toLowerCase().includes("cardnumber") || key.toLowerCase().includes("accountnumber") ||
      key.toLowerCase().includes("ssn") || key.toLowerCase().includes("social")) {
    const str = String(value).replace(/\s/g, "");
    if (str.length >= 4) {
      return { formatted: `${"•".repeat(str.length - 4)} ${str.slice(-4)}`, type: "masked" };
    }
  }

  return { formatted: String(value), type: "text" };
};

export const EnhancedEntryViewDialog: React.FC<EnhancedEntryViewDialogProps> = ({
  entry,
  isOpen,
  onClose,
  onEdit,
  onFill,
  onUseAsTemplate,
  onViewDocument,
  onPrint,
  allEntries = [],
  onOpenRelatedEntry,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  // Listen for canonical Nova close event
  useEffect(() => {
    const handleCloseCommand = () => {
      if (isOpen) {
        onClose();
      }
    };

    window.addEventListener("nova:close", handleCloseCommand);
    return () => {
      window.removeEventListener("nova:close", handleCloseCommand);
    };
  }, [isOpen, onClose]);

  if (!entry) return null;

  const category = entry.fields.category as string || "Personal";
  const config = getCategoryConfig(category);
  const CategoryIcon = config.icon;

  // Extract images from the entry
  const entryImages = extractImagesFromEntry(entry);

  // Check if this is a document entry with an uploaded file
  const isDocumentWithFile = entry.fields.category === "Documents" && entry.fields.hasUploadedFile;
  const hasFile = entry.fields.hasUploadedFile && entry.fields.fileName;

  // Filter out metadata fields (using imported metadataFields)
  const displayFields = Object.entries(entry.fields)
    .filter(([key]) => !metadataFields.includes(key))
    .filter(([key, value]) => {
      if (key === "category") return false;
      // Skip image fields that are already shown in the gallery
      if (entryImages.includes(String(value)) ||
          (Array.isArray(value) && value.some(v => entryImages.includes(String(v))))) {
        return false;
      }
      if (value === null || value === undefined || value === "") return false;
      if (typeof value === "object" && "columns" in (value as Record<string, unknown>) && "rows" in (value as Record<string, unknown>)) {
        return Array.isArray((value as TableData).rows) && (value as TableData).rows.length > 0;
      }
      return true;
    });
  const hasMeaningfulDetails = displayFields.length > 0 || entryImages.length > 0 || Boolean(hasFile);

  const handleDownload = async () => {
    if (!entry.fields.hasUploadedFile || !entry.fields.fileName) {
      toast.error("No file available for download");
      return;
    }

    setIsDownloading(true);

    try {
      const allKeys = Object.keys(localStorage);
      const documentKeys = allKeys.filter(key => key.startsWith("document_"));

      let fileData = null;
      for (const key of documentKeys) {
        try {
          const storedData = JSON.parse(localStorage.getItem(key) || "");
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

      const link = document.createElement("a");
      link.href = fileData.data;
      link.download = fileData.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Downloaded ${fileData.name}`);
    } catch (error) {
      logError("Download error", error);
      toast.error("Failed to download file");
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    if (!hasMeaningfulDetails) {
      toast.error("Add details before printing this entry.");
      return;
    }
    if (onPrint) {
      onPrint(entry);
    } else {
      printProfessionally([entry], { title: entry.title, includeMetadata: true });
    }
    toast.success("Print dialog opened");
  };

  const createdDate = new Date(entry.createdAt).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const updatedDate = new Date(entry.updatedAt).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0">
        {/* Header with gradient */}
        <div className={cn(
          "relative px-6 pt-6 pb-8 bg-gradient-to-br",
          config.gradientFrom,
          config.gradientTo
        )}>
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>

          <div className="flex items-start gap-4">
            <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm">
              <CategoryIcon className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-2xl font-bold text-white mb-2">
                {entry.title}
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm">
                  {category}
                </Badge>
                {hasFile && (
                  <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm gap-1">
                    <FileText className="w-3 h-3" />
                    {entry.fields.fileName}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="mt-4 flex flex-wrap gap-4 text-white/80 text-sm">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>Created {createdDate}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>Updated {updatedDate}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 overflow-y-auto max-h-[calc(90vh-280px)]">
          {/* Images Gallery */}
          {entryImages.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Images ({entryImages.length})
              </h3>
              <ImageGallery images={entryImages} readOnly={true} />
            </div>
          )}

          <div className="mb-6">
            <EntryIntelligencePanel
              entry={entry}
              allEntries={allEntries}
              onOpenEntry={onOpenRelatedEntry}
            />
          </div>

          <div className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Memory saved</p>
            <p className="mt-1 text-sm text-muted-foreground">
              This is stored under {category}. Add more details anytime to make it easier for Nova to retrieve later.
            </p>
          </div>

          {/* Entry Fields */}
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
              Entry Details
            </h3>

            <div className="grid gap-4">
              {!hasMeaningfulDetails && (
                <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                  Saved as-is. No extra details have been added yet, but your original memory is safe in the archive.
                </div>
              )}
              {displayFields.map(([key, value]) => {
                // Handle table fields
                if (typeof value === "object" && value !== null && "columns" in value && "rows" in value) {
                  const tableData = value as TableData;
                  const isShoppingList = tableData.columns.some(col =>
                    ["item", "quantity", "price", "cost", "purchased", "got it"].some(term =>
                      col.name.toLowerCase().includes(term)
                    )
                  );

                  return (
                    <div key={key} className="space-y-2">
                      <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Tag className={cn("w-4 h-4", config.color)} />
                        {formatContextualFieldName(key, { category, title: entry.title })}
                      </label>
                      <div className="rounded-lg border overflow-hidden">
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
                    </div>
                  );
                }

                // Handle regular fields
                const FieldIcon = config.fieldIcons[key] || Tag;
                const { formatted, type } = formatFieldValue(key, value);

                return (
                  <div
                    key={key}
                    className="group p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        "bg-muted group-hover:bg-background transition-colors"
                      )}>
                        <FieldIcon className={cn("w-4 h-4", config.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {formatContextualFieldName(key, { category, title: entry.title })}
                        </label>
                        <div className="mt-1">
                          {type === "email" ? (
                            <a
                              href={`mailto:${formatted}`}
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              {formatted}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : type === "phone" ? (
                            <a
                              href={`tel:${formatted.replace(/\D/g, "")}`}
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              {formatted}
                              <Phone className="w-3 h-3" />
                            </a>
                          ) : type === "url" ? (
                            <a
                              href={formatted.startsWith("http") ? formatted : `https://${formatted}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline flex items-center gap-1"
                            >
                              {formatted}
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : type === "currency" ? (
                            <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                              {formatted}
                            </span>
                          ) : type === "masked" ? (
                            <span className="font-mono text-muted-foreground">
                              {formatted}
                            </span>
                          ) : type === "date" ? (
                            <span className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              {formatted}
                            </span>
                          ) : (
                            <p className="text-foreground whitespace-pre-wrap">
                              {formatted}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="px-6 py-4 border-t bg-muted/30 flex flex-wrap gap-2 justify-end">
          {isDocumentWithFile && onViewDocument && (
            <Button
              onClick={() => {
                onViewDocument(entry);
                onClose();
              }}
              variant="outline"
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              View Document
            </Button>
          )}
          {hasFile && (
            <Button
              onClick={handleDownload}
              variant="outline"
              disabled={isDownloading}
              className="gap-2 text-green-600 hover:text-green-700 border-green-200 hover:border-green-300 hover:bg-green-50"
            >
              <Download className="h-4 w-4" />
              {isDownloading ? "Downloading..." : "Download"}
            </Button>
          )}
          <Button
            onClick={handlePrint}
            variant="outline"
            disabled={!hasMeaningfulDetails}
            title={!hasMeaningfulDetails ? "Add details before printing" : "Print entry"}
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            Print
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
              className="gap-2 text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
            >
              <FileText className="h-4 w-4" />
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
              className="gap-2 text-purple-600 hover:text-purple-700 border-purple-200 hover:border-purple-300"
            >
              <Copy className="h-4 w-4" />
              Use as Template
            </Button>
          )}
          {onEdit && (
            <Button
              onClick={() => {
                onEdit(entry);
                onClose();
              }}
              className={cn("gap-2 bg-gradient-to-r", config.gradientFrom, config.gradientTo, "text-white hover:opacity-90")}
            >
              <Edit className="h-4 w-4" />
              Edit Entry
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedEntryViewDialog;
