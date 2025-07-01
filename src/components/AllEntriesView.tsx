import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SavedEntry } from "@/pages/Dashboard";
import { ArrowLeft, Edit, Trash2, FileText, Download } from "lucide-react";
import { DataEntryForm } from "@/components/DataEntryForm";
import { exportToCSV } from "@/utils/csvExport";
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
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCSV = async () => {
    if (entries.length === 0) {
      toast.error("No entries to export");
      return;
    }

    setIsExporting(true);
    try {
      exportToCSV(entries, 'all-entries');
      toast.success(`Exported ${entries.length} entries to CSV`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Failed to export entries");
    } finally {
      setIsExporting(false);
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
          <Button 
            onClick={handleExportCSV}
            disabled={isExporting}
            variant="outline"
            className="text-green-600 hover:text-green-700"
          >
            <Download className="w-4 h-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </Button>
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
                  {Object.entries(entry.fields).slice(0, 5).map(([key, value]) => (
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
    </div>
  );
};
