
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardMainContent } from '@/components/DashboardMainContent';
import { DataEntryForm } from '@/components/DataEntryForm';
import { VoiceDebugPanel } from '@/components/voice/VoiceDebugPanel';
import { ConversationalVoiceInterface } from '@/components/ConversationalVoiceInterface';
import { useDashboard } from '@/hooks/useDashboard';
import { useUnifiedVoiceProcessor } from '@/hooks/useUnifiedVoiceProcessor';

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
  } = useDashboard();

  // Add voice processor for enhanced voice integration with forms
  const {
    conversationState: voiceConversationState,
    isInConversation: isVoiceInConversation
  } = useUnifiedVoiceProcessor({
    savedEntries: savedEntries,
    onCreateEntry: handleAddEntry,
    onEditEntry: editEntry,
    onDeleteEntry: deleteEntry,
    onSaveEntry: saveEntry,
    onCancelEdit: handleCancelEdit,
  });

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
  }, [navigate]);

  // Listen for voice command to close entry forms
  useEffect(() => {
    const handleCloseFormCommand = () => {
      if (showAddEntry || editingEntry || fillingEntry) {
        console.log('🎤 Voice command: Closing entry form');
        handleCancelEdit();
      }
    };

    window.addEventListener('close-entry-form', handleCloseFormCommand);
    
    return () => {
      window.removeEventListener('close-entry-form', handleCloseFormCommand);
    };
  }, [showAddEntry, editingEntry, fillingEntry, handleCancelEdit]);

  const handleCategorySelect = (categoryName: string) => {
    setSelectedCategory(categoryName);
  };

  const handleAllEntriesSelect = () => {
    setSelectedCategory('All');
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
    >
      {(showAddEntry || editingEntry || fillingEntry) ? (
        <DataEntryForm
          mode={getFormMode()}
          editEntry={editingEntry}
          templateEntry={fillingEntry}
          onSave={saveEntry}
          onCancel={handleCancelEdit}
          isVoiceActive={isVoiceInConversation}
          voiceConversationState={voiceConversationState}
        />
      ) : (
        <DashboardMainContent
          userName={user?.user_metadata?.full_name || user?.email || 'User'}
          savedEntries={savedEntries}
          showDocumentCreator={false}
          showAddEntry={showAddEntry}
          editingEntry={editingEntry}
          fillingEntry={fillingEntry}
          getFormTitle={getFormTitle}
          getFormMode={getFormMode}
          onDocumentSave={() => {}}
          onDocumentCancel={() => {}}
          onSaveEntry={saveEntry}
          onCancelEdit={handleCancelEdit}
          onCategorySelect={handleCategorySelect}
          onAddEntry={handleAddEntry}
          onCreateDocument={() => {}}
          onEnhancedVoiceInput={handleEnhancedVoiceInput}
          onEditEntry={editEntry}
          onFillEntry={fillEntry}
        />
      )}
      
      
      {/* Debug panel for voice system monitoring */}
      <VoiceDebugPanel />
    </DashboardLayout>
  );
}
