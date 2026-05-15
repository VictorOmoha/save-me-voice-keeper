import { Fragment, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SavedEntry } from "@/types/dashboard";
import { ChevronDown, ChevronRight, Edit, Trash2, FileText, ArrowUpDown, Download, Printer, Copy } from "lucide-react";
import { toast } from "sonner";
import { ExportButton } from "@/components/export/ExportButton";
import { EntryViewDialog } from "@/components/recentEntries/EntryViewDialog";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { printProfessionally } from "@/components/entries/ProfessionalPrintView";
import { getEntryIntelligenceSignals } from "@/utils/entryIntelligence";

interface EntriesTableProps {
  entries: SavedEntry[];
  onDelete: (id: string) => void;
  onEdit: (entry: SavedEntry) => void;
  onFill: (entry: SavedEntry) => void;
  onUseAsTemplate: (entry: SavedEntry) => void;
  onBulkDelete: (ids: string[]) => void;
  onViewDocument?: (entry: SavedEntry) => void;
}

type SortField = 'title' | 'createdAt' | 'updatedAt' | 'type';
type SortDirection = 'asc' | 'desc';

export const EntriesTable: React.FC<EntriesTableProps> = ({
  entries,
  onDelete,
  onEdit,
  onFill,
  onUseAsTemplate,
  onBulkDelete,
  onViewDocument,
}) => {
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [viewingEntry, setViewingEntry] = useState<SavedEntry | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [downloadingFiles, setDownloadingFiles] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<SavedEntry | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
        <div className="text-6xl mb-4">📝</div>
        <h3 className="text-xl font-semibold mb-2">No entries yet</h3>
        <p className="text-gray-600">
          Start by adding your first entry using the form above or voice input!
        </p>
      </div>
    );
  }

  const handleDownload = async (entry: SavedEntry) => {
    if (!entry.fields.hasUploadedFile || !entry.fields.fileName) {
      toast.error("No file available for download");
      return;
    }

    setDownloadingFiles(prev => [...prev, entry.id]);
    
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
      console.error('Download error:', error);
      toast.error("Failed to download file");
    } finally {
      setDownloadingFiles(prev => prev.filter(id => id !== entry.id));
    }
  };

  const handlePrint = (entry: SavedEntry) => {
    printProfessionally([entry], { title: entry.title, includeMetadata: true });
    toast.success("Print dialog opened");
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedEntries = [...entries].sort((a, b) => {
    let aValue: string | number | Date, bValue: string | number | Date;
    
    switch (sortField) {
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
        break;
      case 'updatedAt':
        aValue = new Date(a.updatedAt);
        bValue = new Date(b.updatedAt);
        break;
      case 'type':
        aValue = Object.keys(a.fields).length;
        bValue = Object.keys(b.fields).length;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const toggleSelectAll = () => {
    if (selectedEntries.length === entries.length) {
      setSelectedEntries([]);
    } else {
      setSelectedEntries(entries.map(entry => entry.id));
    }
  };

  const toggleSelectEntry = (id: string) => {
    setSelectedEntries(prev => 
      prev.includes(id) 
        ? prev.filter(entryId => entryId !== id)
        : [...prev, id]
    );
  };

  const toggleExpandRow = (id: string) => {
    setExpandedRows(prev =>
      prev.includes(id)
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    );
  };

  const getEntryType = (entry: SavedEntry): string => {
    const fieldCount = Object.keys(entry.fields).length;
    if (fieldCount <= 2) return 'Simple';
    if (fieldCount <= 5) return 'Form';
    return 'Complex';
  };

  const getEntryCategory = (entry: SavedEntry): string => {
    return String(entry.fields.category || entry.category || 'Personal');
  };

  const handleBulkDelete = () => {
    if (selectedEntries.length > 0) {
      setBulkDeleteDialogOpen(true);
    }
  };

  const confirmBulkDelete = () => {
    onBulkDelete(selectedEntries);
    setSelectedEntries([]);
    setBulkDeleteDialogOpen(false);
  };

  const handleDeleteEntry = (entry: SavedEntry) => {
    setEntryToDelete(entry);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteEntry = () => {
    if (entryToDelete) {
      onDelete(entryToDelete.id);
      setEntryToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer hover:bg-gray-50"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        <ArrowUpDown className="h-4 w-4" />
      </div>
    </TableHead>
  );

  const handleRowClick = (entry: SavedEntry, event: React.MouseEvent) => {
    // Don't open dialog if clicking on action buttons, checkboxes, or expand button
    const target = event.target as HTMLElement;
    if (
      target.closest('button') || 
      target.closest('[role="checkbox"]') ||
      target.tagName === 'INPUT'
    ) {
      return;
    }

    // If it's a document entry that can be edited as text, open the document editor directly
    const fields = entry.fields as Record<string, unknown>;
    const category = typeof fields.category === 'string' ? fields.category : '';
    const fileName = typeof fields.fileName === 'string' ? fields.fileName : '';
    const fileType = typeof fields.fileType === 'string' ? fields.fileType : '';
    const hasInline = Boolean(fields.documentContent);
    const isTextBased =
      hasInline ||
      fileType.includes('text') ||
      fileType.includes('html') ||
      fileName.endsWith('.txt') ||
      fileName.endsWith('.html');

    if (category === 'Documents' && isTextBased && onViewDocument) {
      onViewDocument(entry);
      return;
    }

    setViewingEntry(entry);
    setIsViewDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Saved Information</h2>
        <div className="flex items-center space-x-2">
          <ExportButton
            entries={entries}
            selectedEntries={selectedEntries}
            variant="outline"
            size="sm"
          />
          {selectedEntries.length > 0 && (
            <>
              <span className="text-sm text-gray-600">
                {selectedEntries.length} selected
              </span>
              <Button
                onClick={handleBulkDelete}
                variant="destructive"
                size="sm"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete Selected
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedEntries.length === entries.length}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="w-12"></TableHead>
              <SortableHeader field="title">Title</SortableHeader>
              <TableHead>Category</TableHead>
              <SortableHeader field="type">Details</SortableHeader>
              <SortableHeader field="updatedAt">Last Modified</SortableHeader>
              <TableHead>Intelligence</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedEntries.map((entry) => (
              <Fragment key={entry.id}>
                <TableRow 
                  className="hover:bg-gray-50 cursor-pointer text-sm"
                  onClick={(e) => handleRowClick(entry, e)}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedEntries.includes(entry.id)}
                      onCheckedChange={() => toggleSelectEntry(entry.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpandRow(entry.id)}
                      className="p-0 h-auto"
                    >
                      {expandedRows.includes(entry.id) ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="py-4 text-base font-semibold text-foreground">{entry.title}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">{getEntryCategory(entry)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{getEntryType(entry)}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(entry.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const intelligence = getEntryIntelligenceSignals(entry);
                      return (
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                          {intelligence.isEnriched ? (
                            <Fragment>
                              <Badge variant="outline" className="text-xs border-primary/30 text-primary">Smart</Badge>
                              {intelligence.actionItemCount > 0 && (
                                <Badge variant="outline" className="text-xs">{intelligence.actionItemCount} actions</Badge>
                              )}
                              {intelligence.linkedCount > 0 && (
                                <Badge variant="outline" className="text-xs">{intelligence.linkedCount} linked</Badge>
                              )}
                              {intelligence.reminderLikeCount > 0 && (
                                <Badge variant="outline" className="text-xs border-amber-300 text-amber-700">Deadline</Badge>
                              )}
                              {intelligence.tags.slice(0, 1).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                              ))}
                            </Fragment>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {entry.fields.hasUploadedFile && entry.fields.fileName && (
                        <Button
                          onClick={() => handleDownload(entry)}
                          variant="ghost"
                          size="sm"
                          disabled={downloadingFiles.includes(entry.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        onClick={() => handlePrint(entry)}
                        variant="ghost"
                        size="sm"
                        className="text-purple-600 hover:text-purple-700"
                      >
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => onFill(entry)}
                        variant="ghost"
                        size="sm"
                        className="text-green-600 hover:text-green-700"
                        title="Fill Form"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => onUseAsTemplate(entry)}
                        variant="ghost"
                        size="sm"
                        className="text-purple-600 hover:text-purple-700"
                        title="Use as Template"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => onEdit(entry)}
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700"
                        title="Edit Entry"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteEntry(entry)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                {expandedRows.includes(entry.id) && (
                  <TableRow>
                    <TableCell colSpan={8} className="bg-gray-50 p-4">
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900">Fields Preview:</h4>
                        <div className="grid gap-2">
                          {Object.entries(entry.fields)
                            .filter(([key, value]) => key !== 'category' && value !== null && value !== undefined && value !== '')
                            .map(([key, value]) => (
                              <div key={key} className="flex items-start space-x-2 text-sm">
                                <span className="font-medium text-gray-700 min-w-0 w-1/3">
                                  {key}:
                                </span>
                                <span className="text-gray-900 break-words flex-1">
                                  {String(value)}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* View Entry Dialog */}
      <EntryViewDialog
        entry={viewingEntry}
        isOpen={isViewDialogOpen}
        onClose={() => {
          setIsViewDialogOpen(false);
          setViewingEntry(null);
        }}
        onEdit={(entry) => {
          onEdit(entry);
          setIsViewDialogOpen(false);
          setViewingEntry(null);
        }}
        onFill={(entry) => {
          onFill(entry);
          setIsViewDialogOpen(false);
          setViewingEntry(null);
        }}
        onUseAsTemplate={(entry) => {
          onUseAsTemplate(entry);
          setIsViewDialogOpen(false);
          setViewingEntry(null);
        }}
        onViewDocument={onViewDocument}
      />

      {/* Delete Confirmation Dialogs */}
      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setEntryToDelete(null);
        }}
        onConfirm={confirmDeleteEntry}
        title={entryToDelete?.title || ""}
      />

      <DeleteConfirmDialog
        isOpen={bulkDeleteDialogOpen}
        onClose={() => setBulkDeleteDialogOpen(false)}
        onConfirm={confirmBulkDelete}
        title=""
        isMultiple={true}
        count={selectedEntries.length}
      />
    </div>
  );
};
