
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SavedEntry } from "@/pages/Dashboard";
import { DocumentCreator } from "@/components/DocumentCreator";
import { DataEntryForm } from "@/components/DataEntryForm";
import { CategoryHeader } from "./categoryView/CategoryHeader";
import { EntryCard } from "./categoryView/EntryCard";
import { EmptyState } from "./categoryView/EmptyState";
import { useDownload } from "./categoryView/useDownload";
import { useCategoryFilter } from "./categoryView/useCategoryFilter";

interface CategoryViewProps {
  categoryName: string;
  entries: SavedEntry[];
  onBack: () => void;
  onEdit: (entry: SavedEntry) => void;
  onDelete: (id: string) => void;
  onFill: (entry: SavedEntry) => void;
  onCreateEntry: (categoryName: string) => void;
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
  const { downloadingFiles, handleDownload } = useDownload();
  const { filterEntriesByCategory } = useCategoryFilter();

  console.log('DIAGNOSTIC: CategoryView rendered with:', { 
    categoryName, 
    showDocumentCreator, 
    showAddEntry,
    editingEntry: editingEntry?.title,
    fillingEntry: fillingEntry?.title,
    totalEntries: entries.length
  });

  // Enhanced diagnostic logging for entries
  console.log('DIAGNOSTIC: All entries details:', entries.map(entry => ({
    id: entry.id,
    title: entry.title,
    category: entry.fields.category,
    documentType: entry.fields.documentType,
    fileName: entry.fields.fileName,
    hasUploadedFile: entry.fields.hasUploadedFile,
    allFields: Object.keys(entry.fields)
  })));

  const handleCreateEntry = () => {
    console.log('DIAGNOSTIC: Create button clicked for category:', categoryName);
    onCreateEntry(categoryName);
  };

  const categoryEntries = filterEntriesByCategory(entries, categoryName);

  console.log('DIAGNOSTIC: Filtered entries for', categoryName, ':', {
    totalEntries: entries.length,
    categoryEntries: categoryEntries.length,
    categoryEntriesList: categoryEntries.map(e => ({ 
      id: e.id,
      title: e.title, 
      category: e.fields.category,
      documentType: e.fields.documentType,
      fileName: e.fields.fileName
    }))
  });

  return (
    <div className="space-y-6">
      <CategoryHeader
        categoryName={categoryName}
        entriesCount={categoryEntries.length}
        onBack={onBack}
        onCreateEntry={handleCreateEntry}
      />

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
        <EmptyState
          categoryName={categoryName}
          onCreateEntry={handleCreateEntry}
        />
      ) : (
        <div className="grid gap-4">
          {categoryEntries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onEdit={onEdit}
              onDelete={onDelete}
              onFill={onFill}
              onDownload={handleDownload}
              isDownloading={downloadingFiles.includes(entry.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
