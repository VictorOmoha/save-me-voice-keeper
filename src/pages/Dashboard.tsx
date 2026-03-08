import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardMainContent } from '@/components/DashboardMainContent';
import { DataEntryForm } from '@/components/DataEntryForm';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
const DocumentCreator = lazy(() =>
  import('@/components/DocumentCreator').then((module) => ({ default: module.DocumentCreator }))
);
const EnhancedDocumentViewer = lazy(() =>
  import('@/components/documents/EnhancedDocumentViewer').then((module) => ({ default: module.EnhancedDocumentViewer }))
);
const DocumentEditor = lazy(() =>
  import('@/components/documents/DocumentEditor').then((module) => ({ default: module.DocumentEditor }))
);
import { VoiceErrorBoundary } from '@/components/voice/ErrorBoundary';
import { useDashboard } from '@/hooks/useDashboard';
import { useAuth } from '@/contexts/AuthContext';
import { SavedEntry } from '@/types/dashboard';
import { toast } from 'sonner';

const categories = [
  { name: 'Documents', icon: '📄', description: 'Official papers, certificates, contracts' },
  { name: 'Health', icon: '🏥', description: 'Medical records, prescriptions, appointments' },
  { name: 'Contacts', icon: '👥', description: 'People, businesses, emergency contacts' },
  { name: 'Finance', icon: '💰', description: 'Bank info, investments, insurance' },
  { name: 'Personal', icon: '👤', description: 'Personal notes, memories, goals' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showDocumentCreator, setShowDocumentCreator] = useState(false);
  const [documentViewerState, setDocumentViewerState] = useState<{
    isOpen: boolean;
    entry: SavedEntry | null;
  }>({ isOpen: false, entry: null });
  const [documentEditorState, setDocumentEditorState] = useState<{
    isOpen: boolean;
    entry: SavedEntry | null;
  }>({ isOpen: false, entry: null });
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    entry: SavedEntry | null;
    onConfirm: () => void;
  }>({
    isOpen: false,
    entry: null,
    onConfirm: () => {}
  });

  const {
    savedEntries,
    isLoading: entriesLoading,
    isSaving,
    searchQuery,
    setSearchQuery,
    showAddEntry,
    setShowAddEntry,
    editingEntry,
    setEditingEntry,
    fillingEntry,
    setFillingEntry,
    templateEntry,
    setTemplateEntry,
    saveEntry,
    deleteEntry,
    editEntry,
    fillEntry,
    useAsTemplate,
    handleCancelEdit,
    getFormMode,
    getFormTitle,
    handleAddEntry,
    refreshEntries,
  } = useDashboard();

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }

    const checkOnboarding = async () => {
      try {
        const prefsRef = doc(db, 'user_preferences', user.uid);
        const prefsSnap = await getDoc(prefsRef);

        if (!prefsSnap.exists()) {
          navigate('/onboarding');
        }
      } catch (error) {
        console.log('Could not fetch preferences:', error);
      }
    };

    checkOnboarding();
  }, [authLoading, isAuthenticated, user, navigate]);

  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      handleAddEntry();
    }
  }, [searchParams, handleAddEntry]);

  useEffect(() => {
    const requestedCategory = searchParams.get('category');
    if (!requestedCategory) return;

    setSelectedCategory(requestedCategory);
    setTemplateEntry(null);
    setFillingEntry(null);
    setEditingEntry(null);
    setShowAddEntry(true);
  }, [searchParams, setTemplateEntry, setFillingEntry, setEditingEntry, setShowAddEntry]);

  useEffect(() => {
    const handleCloseFormCommand = () => {
      if (showAddEntry || editingEntry || fillingEntry || templateEntry || showDocumentCreator) {
        console.log('🎤 Voice command: Closing entry form');
        handleCancelEdit();
        setShowDocumentCreator(false);
      }
    };

    const handleDeleteConfirmation = (event: CustomEvent) => {
      setDeleteDialog({
        isOpen: true,
        entry: event.detail.entry,
        onConfirm: event.detail.onConfirm
      });
    };

    window.addEventListener('close-entry-form', handleCloseFormCommand);
    window.addEventListener('nova:close', handleCloseFormCommand);
    window.addEventListener('show-delete-confirmation', handleDeleteConfirmation as EventListener);

    return () => {
      window.removeEventListener('close-entry-form', handleCloseFormCommand);
      window.removeEventListener('nova:close', handleCloseFormCommand);
      window.removeEventListener('show-delete-confirmation', handleDeleteConfirmation as EventListener);
    };
  }, [showAddEntry, editingEntry, fillingEntry, templateEntry, showDocumentCreator, handleCancelEdit]);

  const handleCategorySelect = (categoryName: string) => {
    setSelectedCategory(categoryName);
    navigate(`/category/${encodeURIComponent(categoryName)}`);
  };

  const handleAllEntriesSelect = () => {
    navigate('/all-entries');
  };

  const handleViewAllEntries = () => {
    navigate('/all-entries');
  };

  const handleCreateDocument = () => {
    console.log('📄 Dashboard: Create document triggered');
    setShowDocumentCreator(true);
  };

  const handleDocumentSave = (entry: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log('📄 Dashboard: Document save triggered');
    saveEntry(entry);
    setShowDocumentCreator(false);
  };

  const handleDocumentCancel = () => {
    console.log('📄 Dashboard: Document creation cancelled');
    setShowDocumentCreator(false);
  };

  const handleViewDocument = (entry: SavedEntry) => {
    console.log('📄 Dashboard: View document triggered for:', entry.title);
    const fileName = String(entry.fields.fileName || '').toLowerCase();
    const fileType = String(entry.fields.fileType || '').toLowerCase();
    const hasInline = Boolean(entry.fields?.documentContent);
    const isTextBased =
      hasInline ||
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

  const handleCloseDocumentViewer = () => {
    setDocumentViewerState({ isOpen: false, entry: null });
  };

  const handleOpenRelatedEntry = (entry: SavedEntry) => {
    setDocumentViewerState({ isOpen: false, entry: null });
    navigate(`/all-entries/${entry.id}`);
  };

  const handleEditDocument = (entry: SavedEntry) => {
    console.log('📝 Dashboard: Edit document triggered for:', entry.title);
    setDocumentViewerState({ isOpen: false, entry: null });
    setDocumentEditorState({ isOpen: true, entry });
  };

  const handleCloseDocumentEditor = () => {
    setDocumentEditorState({ isOpen: false, entry: null });
  };

  const handleDocumentSaved = (updatedEntry: SavedEntry) => {
    toast.success('Document updated successfully!');
    refreshEntries?.();
    setDocumentEditorState({ isOpen: false, entry: null });
  };

  const userName = user?.displayName || user?.email || 'User';

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <VoiceErrorBoundary>
      <DashboardLayout
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        userName={userName}
        savedEntries={savedEntries}
        onAddEntry={handleAddEntry}
        onCategorySelect={handleCategorySelect}
        onAllEntriesSelect={handleAllEntriesSelect}
        onEditEntry={editEntry}
        onDeleteEntry={deleteEntry}
        onSaveEntry={saveEntry}
        onCancelEdit={handleCancelEdit}
        onFillEntry={fillEntry}
        onUseAsTemplate={useAsTemplate}
      >
        {(showAddEntry || editingEntry || fillingEntry || templateEntry || showDocumentCreator) ? (
          <>
            {showDocumentCreator ? (
              <div className="p-6">
                <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading document tools…</div>}>
                  <DocumentCreator
                    onSave={handleDocumentSave}
                    onCancel={handleDocumentCancel}
                  />
                </Suspense>
              </div>
            ) : (
              <DataEntryForm
                mode={getFormMode()}
                editEntry={editingEntry || fillingEntry}
                templateEntry={templateEntry}
                onSave={saveEntry}
                onCancel={handleCancelEdit}
                isVoiceActive={false}
                isSaving={isSaving}
              />
            )}
          </>
        ) : (
          <DashboardMainContent
            userName={userName}
            savedEntries={savedEntries}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            showDocumentCreator={showDocumentCreator}
            showAddEntry={showAddEntry}
            editingEntry={editingEntry}
            fillingEntry={fillingEntry}
            getFormTitle={getFormTitle}
            getFormMode={getFormMode}
            onDocumentSave={handleDocumentSave}
            onDocumentCancel={handleDocumentCancel}
            onSaveEntry={saveEntry}
            onCancelEdit={handleCancelEdit}
            onCategorySelect={handleCategorySelect}
            onAddEntry={handleAddEntry}
            onCreateDocument={handleCreateDocument}
            onEditEntry={editEntry}
            onFillEntry={fillEntry}
            onUseAsTemplate={useAsTemplate}
            onDeleteEntry={deleteEntry}
            onViewDocument={handleViewDocument}
            onViewAllEntries={handleViewAllEntries}
            isSaving={isSaving}
          />
        )}

        <Suspense fallback={null}>
          <EnhancedDocumentViewer
            isOpen={documentViewerState.isOpen}
            onClose={handleCloseDocumentViewer}
            entry={documentViewerState.entry}
            onEdit={handleEditDocument}
            allEntries={savedEntries}
            onOpenRelatedEntry={handleOpenRelatedEntry}
          />

          <DocumentEditor
            isOpen={documentEditorState.isOpen}
            onClose={handleCloseDocumentEditor}
            entry={documentEditorState.entry}
            onSave={handleDocumentSaved}
          />
        </Suspense>

        <DeleteConfirmDialog
          isOpen={deleteDialog.isOpen}
          onClose={() => setDeleteDialog(prev => ({ ...prev, isOpen: false }))}
          onConfirm={() => {
            deleteDialog.onConfirm();
            setDeleteDialog(prev => ({ ...prev, isOpen: false }));
          }}
          title={deleteDialog.entry?.title || ''}
        />
      </DashboardLayout>
    </VoiceErrorBoundary>
  );
}
