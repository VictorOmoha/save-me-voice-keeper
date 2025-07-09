
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SavedEntry } from "@/types/dashboard";
import { ArrowLeft, Edit, Trash2, FileText, Download, Eye } from "lucide-react";
import { DataEntryForm } from "@/components/DataEntryForm";
import { EntryViewDialog } from "@/components/recentEntries/EntryViewDialog";
import { ExportButton } from "@/components/export/ExportButton";
import { toast } from "sonner";
import { useState } from "react";

interface AllEntriesViewProps {
  entries: SavedEntry[];
  onBack: () => void;
  onEdit: (entry: SavedEntry) => void;
  onDelete: (id: string) => void;
  onFill: (entry: SavedEntry) => void;
  showAddEntry?: boolean;
  editingEntry?: SavedEntry | null;
  fillingEntry?: SavedEntry | null;
  onSaveEntry?: (entry: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancelEdit?: () => void;
  getFormTitle?: () => string;
  getFormMode?: () => 'create' | 'edit' | 'fill';
}

export const AllEntriesView: React.FC<AllEntriesViewProps> = ({
  entries,
  onBack,
  onEdit,
  onDelete,
  onFill,
  showAddEntry = false,
  editingEntry = null,
  fillingEntry = null,
  onSaveEntry = () => {},
  onCancelEdit = () => {},
  getFormTitle = () => 'Add New Entry',
  getFormMode = () => 'create'
}) => {
  const [downloadingFiles, setDownloadingFiles] = useState<string[]>([]);
  const [viewingEntry, setViewingEntry] = useState<SavedEntry | null>(null);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button onClick={onBack} variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">All Entries</h1>
          <Badge variant="secondary">{entries.length} entries</Badge>
        </div>
        
        {entries.length > 0 && (
          <ExportButton
            entries={entries}
            variant="outline"
            size="sm"
          />
        )}
      </div>

      {/* Add/Edit Entry Form */}
      {showAddEntry && (
        <Card>
          <CardHeader>
            <CardTitle>{getFormTitle()}</CardTitle>
          </CardHeader>
          <CardContent>
            <DataEntryForm 
              onSave={onSaveEntry}
              onCancel={onCancelEdit}
              editEntry={editingEntry}
              templateEntry={fillingEntry}
              mode={getFormMode()}
            />
          </CardContent>
        </Card>
      )}

      {entries.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold mb-2">No entries yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first entry to get started!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {entries.map((entry) => (
            <Card key={entry.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-xl">{entry.title}</CardTitle>
                    {entry.fields.category && (
                      <Badge variant="outline" className="mt-1">
                        {entry.fields.category}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </Badge>
                  {entry.fields.fileName && (
                    <Badge variant="secondary" className="text-xs">
                      {entry.fields.fileName}
                    </Badge>
                  )}
                  <Button
                    onClick={() => setViewingEntry(entry)}
                    variant="outline"
                    size="sm"
                    className="text-gray-600 hover:text-gray-700"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  {entry.fields.hasUploadedFile && entry.fields.fileName && (
                    <Button
                      onClick={() => handleDownload(entry)}
                      variant="outline"
                      size="sm"
                      disabled={downloadingFiles.includes(entry.id)}
                      className="text-green-600 hover:text-green-700"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  )}
                  <Button 
                    onClick={() => onFill(entry)}
                    variant="outline" 
                    size="sm"
                    className="text-green-600 hover:text-green-700"
                  >
                    Fill Form
                  </Button>
                  <Button 
                    onClick={() => onEdit(entry)}
                    variant="outline" 
                    size="sm"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    onClick={() => onDelete(entry.id)}
                    variant="outline" 
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {Object.entries(entry.fields)
                    .filter(([key]) => !['hasUploadedFile', 'fileName', 'fileSize', 'fileType'].includes(key))
                    .slice(0, 5)
                    .map(([key, value]) => (
                    <div key={key} className="flex flex-col sm:flex-row sm:items-center">
                      <span className="font-medium text-gray-700 mb-1 sm:mb-0 sm:w-1/3">
                        {key}:
                      </span>
                      <span className="text-gray-900 sm:w-2/3 truncate">
                        {key === 'fileSize' && typeof value === 'number' 
                          ? `${(value / 1024).toFixed(1)} KB`
                          : String(value || 'N/A')
                        }
                      </span>
                    </div>
                  ))}
                  {Object.keys(entry.fields).length > 5 && (
                    <div className="text-sm text-muted-foreground">
                      +{Object.keys(entry.fields).length - 5} more fields...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Entry View Dialog */}
      <EntryViewDialog
        entry={viewingEntry}
        isOpen={viewingEntry !== null}
        onClose={() => setViewingEntry(null)}
        onEdit={onEdit}
        onFill={onFill}
      />
    </div>
  );
};
