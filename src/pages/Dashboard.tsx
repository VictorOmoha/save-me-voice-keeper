
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardVoiceListener } from '@/components/DashboardVoiceListener';
import { DashboardMainContent } from '@/components/DashboardMainContent';
import { DataEntryForm } from '@/components/DataEntryForm';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { DocumentCreator } from '@/components/DocumentCreator';
import { EnhancedDocumentViewer } from '@/components/documents/EnhancedDocumentViewer';
import { DocumentEditor } from '@/components/documents/DocumentEditor';
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

  // Use the comprehensive dashboard hook that includes voice handling
  const {
    savedEntries,
    isLoading: entriesLoading,
    isSaving,
    searchQuery,
    setSearchQuery,
    showAddEntry,
    editingEntry,
    fillingEntry,
    saveEntry,
    deleteEntry,
    editEntry,
    fillEntry,
    handleCancelEdit,
    getFormMode,
    getFormTitle,
    handleAddEntry,
    handleEnhancedVoiceInput,
    isVoiceProcessing,
    lastVoiceCommand,
    conversationState,
    hasPendingConfirmation,
    conversationData,
    cancelCurrentOperation,
    refreshEntries,
  } = useDashboard();

  // Voice input handler is provided by useDashboard hook (handleEnhancedVoiceInput)

  // Check auth state and redirect if needed
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;

    // If not authenticated, redirect to login
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }

    // Check onboarding in background (non-blocking)
    const checkOnboarding = async () => {
      try {
        const prefsRef = doc(db, 'user_preferences', user.uid);
        const prefsSnap = await getDoc(prefsRef);

        // Only redirect to onboarding if preferences doc doesn't exist at all
        if (!prefsSnap.exists()) {
          navigate('/onboarding');
        }
      } catch (error) {
        // If error, just continue - don't block dashboard
        console.log('Could not fetch preferences:', error);
      }
    };

    checkOnboarding();
  }, [authLoading, isAuthenticated, user, navigate]);

  // Listen for voice command to close entry forms
  useEffect(() => {
    const handleCloseFormCommand = () => {
      if (showAddEntry || editingEntry || fillingEntry) {
        console.log('🎤 Voice command: Closing entry form');
        handleCancelEdit();
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
    window.addEventListener('show-delete-confirmation', handleDeleteConfirmation as EventListener);

    return () => {
      window.removeEventListener('close-entry-form', handleCloseFormCommand);
      window.removeEventListener('show-delete-confirmation', handleDeleteConfirmation as EventListener);
    };
  }, [showAddEntry, editingEntry, fillingEntry, handleCancelEdit]);

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

  const handleEditDocument = (entry: SavedEntry) => {
    console.log('📝 Dashboard: Edit document triggered for:', entry.title);
    setDocumentViewerState({ isOpen: false, entry: null }); // Close viewer
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

  // Get user display name (Firebase uses displayName, not user_metadata)
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
        onEnhancedVoiceInput={handleEnhancedVoiceInput}
      >
      {(showAddEntry || editingEntry || fillingEntry || showDocumentCreator) ? (
        <>
          {showDocumentCreator ? (
            // Show DocumentCreator when creating documents
            <div className="p-6">
              <DocumentCreator
                onSave={handleDocumentSave}
                onCancel={handleDocumentCancel}
              />
            </div>
          ) : (
            // Use standard DataEntryForm for all entries
            <DataEntryForm
              mode={getFormMode()}
              editEntry={editingEntry}
              templateEntry={fillingEntry}
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
          onEnhancedVoiceInput={handleEnhancedVoiceInput}
          onEditEntry={editEntry}
          onFillEntry={fillEntry}
          onDeleteEntry={deleteEntry}
          onViewDocument={handleViewDocument}
          onViewAllEntries={handleViewAllEntries}
          isVoiceProcessing={isVoiceProcessing}
          isSaving={isSaving}
          lastVoiceCommand={lastVoiceCommand}
          conversationState={conversationState}
          hasPendingConfirmation={hasPendingConfirmation}
          onCancelVoice={cancelCurrentOperation}
          conversationData={conversationData}
        />
      )}

      {/* Enhanced Document Viewer */}
      <EnhancedDocumentViewer
        isOpen={documentViewerState.isOpen}
        onClose={handleCloseDocumentViewer}
        entry={documentViewerState.entry}
        onEdit={handleEditDocument}
      />

      {/* Document Editor */}
      <DocumentEditor
        isOpen={documentEditorState.isOpen}
        onClose={handleCloseDocumentEditor}
        entry={documentEditorState.entry}
        onSave={handleDocumentSaved}
      />


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
