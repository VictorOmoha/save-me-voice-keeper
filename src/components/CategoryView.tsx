
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SavedEntry } from "@/types/dashboard";
import { DocumentCreator } from "@/components/DocumentCreator";
import { DataEntryForm } from "@/components/DataEntryForm";
import { CategoryHeader } from "./categoryView/CategoryHeader";
import { EntryCard } from "./categoryView/EntryCard";
import { EmptyState } from "./categoryView/EmptyState";
import { useDownload } from "./categoryView/useDownload";
import { useCategoryFilter } from "./categoryView/useCategoryFilter";
import { ExportButton } from "@/components/export/ExportButton";

interface CategoryViewProps {
  categoryName: string;
  entries: SavedEntry[];
  onBack?: () => void;
  onEdit: (entry: SavedEntry) => void;
  onDelete: (id: string) => void;
  onFill: (entry: SavedEntry) => void;
  onUseAsTemplate?: (entry: SavedEntry) => void;
  onCreateEntry: (categoryName: string) => void;
  showDocumentCreator?: boolean;
  showAddEntry?: boolean;
  editingEntry?: SavedEntry | null;
  templateEntry?: SavedEntry | null;
  onDocumentSave?: (entry: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDocumentCancel?: () => void;
  onSaveEntry?: (entry: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancelEdit?: () => void;
  getFormTitle?: () => string;
  getFormMode?: () => 'create' | 'edit' | 'fill' | 'template';
  isSaving?: boolean;
}

export const CategoryView: React.FC<CategoryViewProps> = ({
  categoryName,
  entries,
  onBack,
  onEdit,
  onDelete,
  onFill,
  onUseAsTemplate,
  onCreateEntry,
  showDocumentCreator = false,
  showAddEntry = false,
  editingEntry = null,
  templateEntry = null,
  onDocumentSave = () => {},
  onDocumentCancel = () => {},
  onSaveEntry = () => {},
  onCancelEdit = () => {},
  getFormTitle = () => 'Add New Entry',
  getFormMode = () => 'create',
  isSaving = false,
}) => {
  const { downloadingFiles, handleDownload } = useDownload();
  const { filterEntriesByCategory } = useCategoryFilter();

  const handleCreateEntry = () => {
    onCreateEntry(categoryName);
  };

  const categoryEntries = filterEntriesByCategory(entries, categoryName);

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
              templateEntry={templateEntry}
              mode={getFormMode()}
              isSaving={isSaving}
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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {categoryEntries.length} {categoryEntries.length === 1 ? 'entry' : 'entries'} in {categoryName}
            </h3>
            <ExportButton
              entries={categoryEntries}
              variant="outline"
              size="sm"
            />
          </div>
          
          <div className="grid gap-4">
            {categoryEntries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onEdit={onEdit}
                onDelete={onDelete}
                onFill={onFill}
                onUseAsTemplate={onUseAsTemplate}
                onDownload={handleDownload}
                isDownloading={downloadingFiles.includes(entry.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
