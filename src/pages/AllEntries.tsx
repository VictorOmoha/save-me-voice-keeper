import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Database } from "lucide-react";
import { EntriesTable } from "@/components/EntriesTable";
import { DataEntryForm } from "@/components/DataEntryForm";
import { SavedEntry } from "@/types/dashboard";
import { toast } from "sonner";
import { useSavedEntries } from "@/hooks/useSavedEntries";
import { EnhancedDocumentViewer } from "@/components/documents/EnhancedDocumentViewer";
import { DocumentEditor } from "@/components/documents/DocumentEditor";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useVoiceProcessor } from "@/voice";
import { EntryViewDialog } from "@/components/recentEntries/EntryViewDialog";
export default function AllEntries() {
  const { 
    savedEntries: entries, 
    isLoading, 
    isSaving,
    searchQuery, 
    setSearchQuery, 
    saveEntry, 
    deleteEntry,
    refreshEntries,
  } = useSavedEntries();
  const navigate = useNavigate();
  const { entryId } = useParams();
  
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState<SavedEntry | null>(null);
  const [templateEntry, setTemplateEntry] = useState<SavedEntry | null>(null);
  const [documentViewerState, setDocumentViewerState] = useState<{ isOpen: boolean; entry: SavedEntry | null }>({ isOpen: false, entry: null });
  const [documentEditorState, setDocumentEditorState] = useState<{ isOpen: boolean; entry: SavedEntry | null }>({ isOpen: false, entry: null });
  const [selectedEntryDialog, setSelectedEntryDialog] = useState<{ isOpen: boolean; entry: SavedEntry | null }>({ isOpen: false, entry: null });
  const handleSaveEntry = async (entryData: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      // Use the hook's saveEntry function for both create and edit
      // Pass templateEntry when in fill mode, editingEntry when in edit mode
      await saveEntry(entryData, editingEntry || templateEntry);
      setShowAddEntry(false);
      setEditingEntry(null);
      setTemplateEntry(null);
    } catch (error) {
      console.error('Error saving entry:', error);
      // Error handling is already done in the hook
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      await deleteEntry(id);
    } catch (error) {
      console.error('Error deleting entry:', error);
      // Error handling is already done in the hook
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      // Delete entries one by one using the hook's deleteEntry function
      for (const id of ids) {
        await deleteEntry(id);
      }
      toast.success(`${ids.length} entries deleted successfully!`);
    } catch (error) {
      console.error('Error deleting entries:', error);
      toast.error("Failed to delete entries");
    }
  };

  const handleEditEntry = (entry: SavedEntry) => {
    setEditingEntry(entry);
    setShowAddEntry(true);
  };

  const handleFillEntry = (entry: SavedEntry) => {
    // Create a new entry based on the template - set up fill mode properly
    setEditingEntry(null);
    setTemplateEntry(entry);
    setShowAddEntry(true);
  };

  const handleCancelEdit = () => {
    setShowAddEntry(false);
    setEditingEntry(null);
    setTemplateEntry(null);
  };

  // View/Edit document handlers
  const handleViewDocument = (entry: SavedEntry) => {
    const fileName = String(entry.fields.fileName || '').toLowerCase();
    const fileType = String(entry.fields.fileType || '').toLowerCase();
    const isTextBased =
      fileName.endsWith('.txt') ||
      fileName.endsWith('.html') ||
      fileName.endsWith('.htm') ||
      fileType.includes('text/plain') ||
      fileType.includes('text/html');

    if (isTextBased) {
      setDocumentEditorState({ isOpen: true, entry });
    } else {
      setDocumentViewerState({ isOpen: true, entry });
    }
  };

  const handleCloseDocumentViewer = () => setDocumentViewerState({ isOpen: false, entry: null });
  const handleCloseDocumentEditor = () => setDocumentEditorState({ isOpen: false, entry: null });
  const handleEditFromViewer = (entry: SavedEntry) => {
    setDocumentViewerState({ isOpen: false, entry: null });
    setDocumentEditorState({ isOpen: true, entry });
  };
  const handleDocumentSaved = () => {
    toast.success('Document updated successfully!');
    refreshEntries();
    setDocumentEditorState({ isOpen: false, entry: null });
  };

  // Handle URL parameter for showing specific entry
  useEffect(() => {
    if (entryId && entries.length > 0 && !isLoading) {
      const entry = entries.find(e => e.id === entryId);
      if (entry) {
        setSelectedEntryDialog({ isOpen: true, entry });
      }
    }
  }, [entryId, entries, isLoading]);

  // Voice: wire voice processor for global commands
  const { processVoiceInput } = useVoiceProcessor({
    savedEntries: entries,
    onCreateEntry: () => setShowAddEntry(true),
    onEditEntry: handleEditEntry as any,
    onDeleteEntry: handleDeleteEntry,
    onSaveEntry: handleSaveEntry,
    onCancelEdit: handleCancelEdit,
  });

  if (isLoading) {
    const handleCategorySelectNav = (name: string) => navigate(`/category/${encodeURIComponent(name)}`);
    const handleAllEntriesSelectNav = () => navigate(`/all-entries`);

    return (
      <DashboardLayout
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        savedEntries={entries}
        onAddEntry={() => setShowAddEntry(true)}
        onCategorySelect={handleCategorySelectNav}
        onAllEntriesSelect={handleAllEntriesSelectNav}
        onEditEntry={handleEditEntry as any}
        onDeleteEntry={handleDeleteEntry}
        onSaveEntry={() => {}}
        onCancelEdit={handleCancelEdit}
        onFillEntry={handleFillEntry as any}
        onEnhancedVoiceInput={processVoiceInput}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-12 h-12 border border-galvanized flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Database className="w-6 h-6 text-primary" />
            </div>
            <p className="mono text-xs text-muted-foreground">LOADING_ENTRIES...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const filteredEntries = entries;

  return (
    <DashboardLayout
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      savedEntries={entries}
      onAddEntry={() => setShowAddEntry(true)}
      onCategorySelect={(name) => navigate(`/category/${encodeURIComponent(name)}`)}
      onAllEntriesSelect={() => navigate(`/all-entries`)}
      onEditEntry={handleEditEntry as any}
      onDeleteEntry={handleDeleteEntry}
      onSaveEntry={() => {}}
      onCancelEdit={handleCancelEdit}
      onFillEntry={handleFillEntry as any}
      onEnhancedVoiceInput={processVoiceInput}
    >
      {/* Page Header - Skeletal */}
      <div className="mb-6">
        <div className="protocol-tag mb-3">PROTOCOL: DATA_RETRIEVAL</div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="archive-title text-2xl mb-1">ALL_ENTRIES</h1>
            <p className="mono text-xs text-muted-foreground">
              {filteredEntries.length} {filteredEntries.length === 1 ? 'RECORD' : 'RECORDS'} IN_ARCHIVE
            </p>
          </div>
          <button
            onClick={() => setShowAddEntry(true)}
            className="btn-galvanized btn-galvanized-primary"
          >
            <Plus className="w-4 h-4" />
            ADD_ENTRY
          </button>
        </div>
      </div>

      {showAddEntry && (
        <div className="galvanized-card p-6 mb-6">
          <h3 className="mono text-sm font-bold text-foreground mb-4 pb-3 border-b border-galvanized">
            {editingEntry ? 'EDIT_ENTRY' : templateEntry ? 'FILL_TEMPLATE' : 'CREATE_NEW_ENTRY'}
          </h3>
          <DataEntryForm
            onSave={handleSaveEntry}
            onCancel={handleCancelEdit}
            editEntry={editingEntry}
            templateEntry={templateEntry}
            mode={editingEntry ? 'edit' : templateEntry ? 'fill' : 'create'}
            isSaving={isSaving}
          />
        </div>
      )}

      <EntriesTable
        entries={filteredEntries}
        onDelete={handleDeleteEntry}
        onEdit={handleEditEntry}
        onFill={handleFillEntry}
        onBulkDelete={handleBulkDelete}
        onViewDocument={handleViewDocument}
      />

      <EnhancedDocumentViewer
        isOpen={documentViewerState.isOpen}
        onClose={handleCloseDocumentViewer}
        entry={documentViewerState.entry}
        onEdit={handleEditFromViewer}
      />

      <DocumentEditor
        isOpen={documentEditorState.isOpen}
        onClose={handleCloseDocumentEditor}
        entry={documentEditorState.entry}
        onSave={handleDocumentSaved}
      />

      {/* Entry View Dialog for URL-selected entries */}
      <EntryViewDialog
        entry={selectedEntryDialog.entry}
        isOpen={selectedEntryDialog.isOpen}
        onClose={() => {
          setSelectedEntryDialog({ isOpen: false, entry: null });
          // Navigate back to all-entries without the entry ID
          navigate('/all-entries');
        }}
        onEdit={(entry) => {
          handleEditEntry(entry);
          setSelectedEntryDialog({ isOpen: false, entry: null });
          navigate('/all-entries');
        }}
        onFill={(entry) => {
          handleFillEntry(entry);
          setSelectedEntryDialog({ isOpen: false, entry: null });
          navigate('/all-entries');
        }}
        onViewDocument={handleViewDocument}
      />
    </DashboardLayout>
  );
}

