
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardMainContent } from '@/components/DashboardMainContent';
import { DataEntryForm } from '@/components/DataEntryForm';
import { VoiceGuidedEntryWizard } from '@/components/VoiceGuidedEntryWizard';
import { VoiceDebugPanel } from '@/components/voice/VoiceDebugPanel';
import { VoiceStatusDebug } from '@/components/VoiceStatusDebug';
import { ConversationalVoiceInterface } from '@/components/ConversationalVoiceInterface';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import { DocumentCreator } from '@/components/DocumentCreator';
import { EnhancedDocumentViewer } from '@/components/documents/EnhancedDocumentViewer';
import { DocumentEditor } from '@/components/documents/DocumentEditor';
import { useDashboard } from '@/hooks/useDashboard';
import { useUnifiedVoiceProcessor } from '@/hooks/useUnifiedVoiceProcessor';
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
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
  } = useDashboard();

  

  // Add voice processor for enhanced voice integration with forms
  const {
    conversationState: voiceConversationState,
    isInConversation: isVoiceInConversation,
    processVoiceInput: unifiedProcessVoiceInput,
    processHybridSelection
  } = useUnifiedVoiceProcessor({
    savedEntries: savedEntries,
    onCreateEntry: handleAddEntry,
    onEditEntry: editEntry,
    onDeleteEntry: deleteEntry,
    onSaveEntry: saveEntry,
    onCancelEdit: handleCancelEdit,
  });

  // Enhanced voice input that handles both commands and conversations
  const enhancedVoiceInputHandler = async (text: string) => {
    console.log('🎤 Dashboard: Enhanced voice input handler called with:', text);
    console.log('📊 Dashboard: Current state check - showAddEntry:', showAddEntry, 'unified isInConversation:', voiceConversationState?.isInConversation);
    console.log('🔍 Dashboard: Unified conversation state:', voiceConversationState);
    
    // If we're in a voice conversation, let the ConversationalVoiceInterface handle it directly
    // to maintain conversation context. Otherwise, use unified processor for commands.
    if (voiceConversationState?.isInConversation) {
      console.log('🎯 Dashboard: In conversation mode - letting ConversationalVoiceInterface handle internally');
      // Don't process here - let the ConversationalVoiceInterface use its internal processor
      return;
    }
    
    console.log('🎯 Dashboard: Not in conversation - routing to unified processor for commands');
    await unifiedProcessVoiceInput(text);
  };

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      setUser(user);
      setLoading(false);
    };

    getUser();
  }, [navigate, handleAddEntry, handleEnhancedVoiceInput]);

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
  };

  const handleAllEntriesSelect = () => {
    setSelectedCategory('All');
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
    // The entry will be automatically updated through the useDashboard hook
    // when the database changes are detected via Supabase real-time subscriptions
    toast.success('Document updated successfully!');
  };

  if (loading || entriesLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <DashboardLayout
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      userName={user?.user_metadata?.full_name || user?.email || 'User'}
      savedEntries={savedEntries}
      onAddEntry={handleAddEntry}
      onCategorySelect={handleCategorySelect}
      onAllEntriesSelect={handleAllEntriesSelect}
      onEditEntry={editEntry}
      onDeleteEntry={deleteEntry}
      onSaveEntry={saveEntry}
      onCancelEdit={handleCancelEdit}
      onFillEntry={fillEntry}
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
            // Use VoiceGuidedEntryWizard for new entries with voice conversation
            showAddEntry && voiceConversationState?.isInConversation ? (
              <VoiceGuidedEntryWizard
                onSave={saveEntry}
                onCancel={handleCancelEdit}
                conversationState={voiceConversationState}
                isVoiceActive={voiceConversationState.isInConversation}
                onHybridSelection={processHybridSelection}
              />
            ) : (
              <DataEntryForm
                mode={getFormMode()}
                editEntry={editingEntry}
                templateEntry={fillingEntry}
                onSave={saveEntry}
                onCancel={handleCancelEdit}
                isVoiceActive={voiceConversationState?.isInConversation || false}
                voiceConversationState={voiceConversationState}
              />
            )
          )}
        </>
      ) : (
        <DashboardMainContent
          userName={user?.user_metadata?.full_name || user?.email || 'User'}
          savedEntries={savedEntries}
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
          onEnhancedVoiceInput={enhancedVoiceInputHandler}
          onEditEntry={editEntry}
          onFillEntry={fillEntry}
          onDeleteEntry={deleteEntry}
          onViewDocument={handleViewDocument}
          onViewAllEntries={handleViewAllEntries}
          isVoiceProcessing={isVoiceProcessing}
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
      
      
      {/* Debug panel for voice system monitoring */}
      <VoiceDebugPanel />
      
      <VoiceStatusDebug
        isListening={false}
        conversationState={conversationState}
        hasPendingConfirmation={hasPendingConfirmation}
        lastCommand={lastVoiceCommand?.action}
        debugMode={true}
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
  );
}
