import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SavedEntry } from "@/pages/Dashboard";
import { ChevronDown, ChevronRight, Edit, Trash2, FileText, ArrowUpDown, Eye } from "lucide-react";

interface EntriesTableProps {
  entries: SavedEntry[];
  onDelete: (id: string) => void;
  onEdit: (entry: SavedEntry) => void;
  onFill: (entry: SavedEntry) => void;
  onBulkDelete: (ids: string[]) => void;
}

type SortField = 'title' | 'createdAt' | 'updatedAt' | 'type';
type SortDirection = 'asc' | 'desc';

export const EntriesTable: React.FC<EntriesTableProps> = ({
  entries,
  onDelete,
  onEdit,
  onFill,
  onBulkDelete,
}) => {
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [viewingEntry, setViewingEntry] = useState<SavedEntry | null>(null);

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedEntries = [...entries].sort((a, b) => {
    let aValue: any, bValue: any;
    
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

  const handleBulkDelete = () => {
    if (selectedEntries.length > 0) {
      onBulkDelete(selectedEntries);
      setSelectedEntries([]);
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Your Saved Information</h2>
        {selectedEntries.length > 0 && (
          <div className="flex items-center space-x-2">
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
          </div>
        )}
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
              <SortableHeader field="type">Type</SortableHeader>
              <SortableHeader field="updatedAt">Last Modified</SortableHeader>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedEntries.map((entry) => (
              <>
                <TableRow key={entry.id} className="hover:bg-gray-50">
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
                  <TableCell className="font-medium">{entry.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{getEntryType(entry)}</Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {new Date(entry.updatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => setViewingEntry(entry)}
                        variant="ghost"
                        size="sm"
                        className="text-purple-600 hover:text-purple-700"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => onFill(entry)}
                        variant="ghost"
                        size="sm"
                        className="text-green-600 hover:text-green-700"
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => onEdit(entry)}
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => onDelete(entry.id)}
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
                    <TableCell colSpan={6} className="bg-gray-50 p-4">
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900">Fields Preview:</h4>
                        <div className="grid gap-2">
                          {Object.entries(entry.fields).map(([key, value]) => (
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
              </>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* View Entry Dialog */}
      <Dialog open={viewingEntry !== null} onOpenChange={() => setViewingEntry(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {viewingEntry?.title}
            </DialogTitle>
          </DialogHeader>
          
          {viewingEntry && (
            <div className="space-y-6">
              {/* Entry Metadata */}
              <div className="flex items-center justify-between text-sm text-gray-600 border-b pb-4">
                <div>
                  <p>Created: {new Date(viewingEntry.createdAt).toLocaleDateString()}</p>
                  <p>Last Modified: {new Date(viewingEntry.updatedAt).toLocaleDateString()}</p>
                </div>
                <Badge variant="outline">{getEntryType(viewingEntry)}</Badge>
              </div>

              {/* Entry Fields */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Entry Details</h3>
                <div className="grid gap-4">
                  {Object.entries(viewingEntry.fields).map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <label className="text-sm font-medium text-gray-700 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      <div className="p-3 bg-gray-50 rounded-md border">
                        <p className="text-gray-900 whitespace-pre-wrap">
                          {String(value) || 'No data'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button
                  onClick={() => {
                    onFill(viewingEntry);
                    setViewingEntry(null);
                  }}
                  variant="outline"
                  className="text-green-600 hover:text-green-700"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Fill Form
                </Button>
                <Button
                  onClick={() => {
                    onEdit(viewingEntry);
                    setViewingEntry(null);
                  }}
                  variant="outline"
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Entry
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
