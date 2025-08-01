
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardMainContent } from '@/components/DashboardMainContent';
import { DataEntryForm } from '@/components/DataEntryForm';
import { VoiceGuidedEntryWizard } from '@/components/VoiceGuidedEntryWizard';
import { VoiceDebugPanel } from '@/components/voice/VoiceDebugPanel';
import { SimplifiedVoiceInterface } from '@/components/SimplifiedVoiceInterface';
import { useDashboardState } from '@/hooks/useDashboardState';
import { useSavedEntries } from '@/hooks/useSavedEntries';

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

  // Use simplified dashboard state management
  const {
    savedEntries,
    isLoading: entriesLoading,
    searchQuery,
    setSearchQuery,
    showAddEntry,
    setShowAddEntry,
    editingEntry,
    setEditingEntry,
    fillingEntry,
    setFillingEntry,
  } = useDashboardState();

  // Use saved entries hook for CRUD operations  
  const {
    saveEntry: saveSavedEntry,
    deleteEntry: deleteSavedEntry,
  } = useSavedEntries();

  // Simplified handlers
  const handleAddEntry = () => {
    console.log('📝 Dashboard: Opening add entry form - setting showAddEntry to true');
    console.log('📝 Dashboard: Current showAddEntry state:', showAddEntry);
    setShowAddEntry(true);
    console.log('📝 Dashboard: Called setShowAddEntry(true)');
  };

  const editEntry = (entry: any) => {
    console.log('✏️ Dashboard: Opening edit form for:', entry.title);
    setEditingEntry(entry);
    setShowAddEntry(false);
  };

  const fillEntry = (entry: any) => {
    console.log('📝 Dashboard: Opening fill form for:', entry.title);
    setFillingEntry(entry);
    setShowAddEntry(false);
  };

  const saveEntry = async (entryData: any) => {
    console.log('💾 Dashboard: Saving entry:', entryData);
    try {
      await saveSavedEntry(entryData);
      handleCancelEdit();
    } catch (error) {
      console.error('❌ Dashboard: Save failed:', error);
    }
  };

  const deleteEntry = async (entryId: string) => {
    console.log('🗑️ Dashboard: Deleting entry:', entryId);
    try {
      await deleteSavedEntry(entryId);
    } catch (error) {
      console.error('❌ Dashboard: Delete failed:', error);
    }
  };

  const handleCancelEdit = () => {
    console.log('❌ Dashboard: Cancelling edit');
    setShowAddEntry(false);
    setEditingEntry(null);
    setFillingEntry(null);
  };

  const getFormMode = () => {
    if (editingEntry) return 'edit';
    if (fillingEntry) return 'fill';
    return 'create';
  };

  const getFormTitle = () => {
    if (editingEntry) return `Edit ${editingEntry.title}`;
    if (fillingEntry) return `Fill ${fillingEntry.title}`;
    return 'Create New Entry';
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
  }, [navigate]);

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
          isVoiceActive={false}
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
          onEditEntry={editEntry}
          onFillEntry={fillEntry}
          onDeleteEntry={deleteEntry}
          onEnhancedVoiceInput={() => Promise.resolve()}
        />
      )}
      
      {/* Simplified Voice Interface */}
      <SimplifiedVoiceInterface
        savedEntries={savedEntries}
        onCreateEntry={handleAddEntry}
        onEditEntry={editEntry}
        onDeleteEntry={deleteEntry}
        onCloseModal={handleCancelEdit}
      />
    </DashboardLayout>
  );
}
