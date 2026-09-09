import {lazy, Suspense, useState} from 'react';
import {SavedEntry} from '@/types/dashboard';
import {DocumentCreator} from '@/components/DocumentCreator';
import {DataEntryForm} from '@/components/DataEntryForm';
import {CategoryHeader} from './categoryView/CategoryHeader';
import {EmptyState} from './categoryView/EmptyState';
import {useCategoryFilter} from './categoryView/useCategoryFilter';
import {ExportButton} from '@/components/export/ExportButton';
import {EnhancedRecentEntries} from '@/components/entries/EnhancedRecentEntries';
import {DeleteConfirmDialog} from '@/components/DeleteConfirmDialog';
import {Button} from '@/components/ui/button';
import {Upload} from 'lucide-react';
const DocumentViewer = lazy(() => import('@/components/documents/EnhancedDocumentViewer').then(module => ({default: module.EnhancedDocumentViewer})));
const DocumentEditor = lazy(() => import('@/components/documents/DocumentEditor').then(module => ({default: module.DocumentEditor})));
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
  onAddDocument?: () => void;
  searchQuery?: string;
  onClearSearch?: () => void;
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
  onAddDocument,
  searchQuery = '',
  onClearSearch,
}) => {
  const [deletingEntry, setDeletingEntry] = useState<SavedEntry | null>(null);
  const [viewingDocument, setViewingDocument] = useState<SavedEntry | null>(null);
  const [editingDocument, setEditingDocument] = useState<SavedEntry | null>(null);
  const { filterEntriesByCategory } = useCategoryFilter();

  const handleCreateEntry = () => {
    onCreateEntry(categoryName);
  };

  const categoryEntries = filterEntriesByCategory(entries, categoryName);

  const isEditing = showAddEntry || showDocumentCreator;
  return <div>
    <CategoryHeader categoryName={categoryName} entriesCount={categoryEntries.length} onCreateEntry={handleCreateEntry}
      isEditing={isEditing} actions={<>{categoryEntries.length > 0 && <ExportButton entries={categoryEntries} variant="outline" />}
        {categoryName === 'Documents' && onAddDocument && <Button variant="outline" className="min-h-11" onClick={onAddDocument}><Upload className="mr-2 h-4 w-4" />Add document</Button>}</>} />
    {showDocumentCreator && <DocumentCreator initialMode="upload" onSave={onDocumentSave} onCancel={onDocumentCancel} />}
    {showAddEntry && <DataEntryForm onSave={onSaveEntry} onCancel={onCancelEdit} editEntry={editingEntry}
      templateEntry={templateEntry} mode={getFormMode()} preselectedCategory={categoryName} isSaving={isSaving} />}
    {!isEditing && (categoryEntries.length === 0 && !searchQuery ? <EmptyState categoryName={categoryName} onCreateEntry={handleCreateEntry} /> :
      <EnhancedRecentEntries entries={categoryEntries} maxEntries={categoryEntries.length} title="Saved memories"
        onEdit={onEdit} onFill={onFill} onUseAsTemplate={onUseAsTemplate} onView={setViewingDocument}
        onDelete={id => setDeletingEntry(categoryEntries.find(entry => entry.id === id) || null)}
        searchQuery={searchQuery} onClearSearch={onClearSearch} />)}
    <DeleteConfirmDialog isOpen={!!deletingEntry} title={deletingEntry?.title || ''} onClose={() => setDeletingEntry(null)}
      onConfirm={() => { if (deletingEntry) onDelete(deletingEntry.id); }} />
    <Suspense fallback={null}>
      {viewingDocument && <DocumentViewer isOpen entry={viewingDocument} allEntries={entries} onClose={() => setViewingDocument(null)}
        onEdit={entry => {setViewingDocument(null); setEditingDocument(entry);}} onOpenRelatedEntry={setViewingDocument} />}
      {editingDocument && <DocumentEditor isOpen entry={editingDocument} onClose={() => setEditingDocument(null)}
        onSave={() => {setEditingDocument(null); window.dispatchEvent(new CustomEvent('nova:entries-changed'));}} />}
    </Suspense>
  </div>;
};
