import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import { EntriesTable } from "@/components/EntriesTable";
import { DataEntryForm } from "@/components/DataEntryForm";
import { DashboardHeader } from "@/components/DashboardHeader";
import { SavedEntry } from "@/types/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useSavedEntries } from "@/hooks/useSavedEntries";
import { EnhancedDocumentViewer } from "@/components/documents/EnhancedDocumentViewer";
import { DocumentEditor } from "@/components/documents/DocumentEditor";
export default function AllEntries() {
  const { 
    savedEntries: entries, 
    isLoading, 
    searchQuery, 
    setSearchQuery, 
    saveEntry, 
    deleteEntry,
    refreshEntries,
  } = useSavedEntries();
  
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState<SavedEntry | null>(null);
  const [documentViewerState, setDocumentViewerState] = useState<{ isOpen: boolean; entry: SavedEntry | null }>({ isOpen: false, entry: null });
  const [documentEditorState, setDocumentEditorState] = useState<{ isOpen: boolean; entry: SavedEntry | null }>({ isOpen: false, entry: null });
  const handleSaveEntry = async (entryData: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingEntry) {
        // For editing, we need to use Supabase update instead
        // This is a simplified version - you may want to implement proper update logic
        toast.info("Edit functionality needs to be implemented with Supabase update");
      } else {
        // Use the hook's saveEntry function
        await saveEntry(entryData);
      }
      setShowAddEntry(false);
      setEditingEntry(null);
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
    // Create a new entry based on the template
    setEditingEntry(null);
    setShowAddEntry(true);
    // You could pre-populate the form with the entry template here
  };

  const handleCancelEdit = () => {
    setShowAddEntry(false);
    setEditingEntry(null);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          savedEntries={entries}
        />
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading entries...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredEntries = entries;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        savedEntries={entries}
      />

      <div className="container mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">All Entries</h1>
              <p className="text-muted-foreground">
                {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'} total
              </p>
            </div>
          </div>
          
          <Button onClick={() => setShowAddEntry(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
          </Button>
        </div>

        {/* Add/Edit Entry Form */}
        {showAddEntry && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                {editingEntry ? 'Edit Entry' : 'Add New Entry'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataEntryForm 
                onSave={handleSaveEntry}
                onCancel={handleCancelEdit}
                editEntry={editingEntry}
                mode={editingEntry ? 'edit' : 'create'}
              />
            </CardContent>
          </Card>
        )}

        {/* Entries Table */}
        <EntriesTable
          entries={filteredEntries}
          onDelete={handleDeleteEntry}
          onEdit={handleEditEntry}
          onFill={handleFillEntry}
          onBulkDelete={handleBulkDelete}
          onViewDocument={handleViewDocument}
        />

        {/* Document Viewer */}
        <EnhancedDocumentViewer
          isOpen={documentViewerState.isOpen}
          onClose={handleCloseDocumentViewer}
          entry={documentViewerState.entry}
          onEdit={handleEditFromViewer}
        />

        {/* Document Editor */}
        <DocumentEditor
          isOpen={documentEditorState.isOpen}
          onClose={handleCloseDocumentEditor}
          entry={documentEditorState.entry}
          onSave={handleDocumentSaved}
        />
      </div>
    </div>
  );
}
