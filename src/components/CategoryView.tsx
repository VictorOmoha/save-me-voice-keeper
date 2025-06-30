
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SavedEntry } from "@/pages/Dashboard";
import { ArrowLeft, Plus } from "lucide-react";
import { DocumentCreator } from "@/components/DocumentCreator";
import { DataEntryForm } from "@/components/DataEntryForm";

interface CategoryViewProps {
  categoryName: string;
  entries: SavedEntry[];
  onBack: () => void;
  onEdit: (entry: SavedEntry) => void;
  onDelete: (id: string) => void;
  onFill: (entry: SavedEntry) => void;
  onCreateEntry: (categoryName: string) => void;
  // Add these new props for handling forms
  showDocumentCreator?: boolean;
  showAddEntry?: boolean;
  editingEntry?: SavedEntry | null;
  fillingEntry?: SavedEntry | null;
  onDocumentSave?: (entry: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDocumentCancel?: () => void;
  onSaveEntry?: (entry: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancelEdit?: () => void;
  getFormTitle?: () => string;
  getFormMode?: () => 'create' | 'edit' | 'fill';
}

export const CategoryView: React.FC<CategoryViewProps> = ({
  categoryName,
  entries,
  onBack,
  onEdit,
  onDelete,
  onFill,
  onCreateEntry,
  showDocumentCreator = false,
  showAddEntry = false,
  editingEntry = null,
  fillingEntry = null,
  onDocumentSave = () => {},
  onDocumentCancel = () => {},
  onSaveEntry = () => {},
  onCancelEdit = () => {},
  getFormTitle = () => 'Add New Entry',
  getFormMode = () => 'create'
}) => {
  console.log('CategoryView rendered with:', { 
    categoryName, 
    showDocumentCreator, 
    showAddEntry,
    editingEntry: editingEntry?.title,
    fillingEntry: fillingEntry?.title
  });

  const handleCreateEntry = () => {
    console.log('Create button clicked for category:', categoryName);
    console.log('onCreateEntry function type:', typeof onCreateEntry);
    if (typeof onCreateEntry === 'function') {
      onCreateEntry(categoryName);
    } else {
      console.error('onCreateEntry is not a function!');
    }
  };

  const categoryEntries = entries.filter(entry => 
    entry.fields.category?.toLowerCase() === categoryName.toLowerCase() ||
    (categoryName === "Documents" && entry.title.toLowerCase().includes("document")) ||
    (categoryName === "Health" && entry.title.toLowerCase().includes("health")) ||
    (categoryName === "Contacts" && entry.title.toLowerCase().includes("contact")) ||
    (categoryName === "Finance" && entry.title.toLowerCase().includes("finance")) ||
    (categoryName === "Personal" && entry.title.toLowerCase().includes("personal"))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button onClick={onBack} variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">{categoryName}</h1>
          <Badge variant="secondary">{categoryEntries.length} entries</Badge>
        </div>
        
        <Button 
          onClick={handleCreateEntry}
          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create {categoryName.slice(0, -1)}
        </Button>
      </div>

      {/* Document Creator */}
      {showDocumentCreator && (
        <Card>
          <CardContent className="p-6">
            <DocumentCreator 
              onSave={onDocumentSave}
              onCancel={onDocumentCancel}
            />
          </CardContent>
        </Card>
      )}

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

      {categoryEntries.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold mb-2">No {categoryName.toLowerCase()} entries yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first {categoryName.toLowerCase()} entry to get started!
            </p>
            <Button 
              onClick={handleCreateEntry}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create {categoryName.slice(0, -1)}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {categoryEntries.map((entry) => (
            <Card key={entry.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl">{entry.title}</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </Badge>
                  <Button 
                    onClick={() => {
                      console.log('Fill button clicked for entry:', entry.title);
                      onFill(entry);
                    }}
                    variant="outline" 
                    size="sm"
                    className="text-green-600 hover:text-green-700"
                  >
                    Fill Form
                  </Button>
                  <Button 
                    onClick={() => {
                      console.log('Edit button clicked for entry:', entry.title);
                      onEdit(entry);
                    }}
                    variant="outline" 
                    size="sm"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Edit
                  </Button>
                  <Button 
                    onClick={() => {
                      console.log('Delete button clicked for entry:', entry.id);
                      onDelete(entry.id);
                    }}
                    variant="outline" 
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    Delete
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {Object.entries(entry.fields).map(([key, value]) => (
                    <div key={key} className="flex flex-col sm:flex-row sm:items-center">
                      <span className="font-medium text-gray-700 mb-1 sm:mb-0 sm:w-1/3">
                        {key}:
                      </span>
                      <span className="text-gray-900 sm:w-2/3">
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
