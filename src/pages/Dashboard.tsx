import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { SavedEntry } from '@/types/dashboard';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardMainContent } from '@/components/DashboardMainContent';
import { DataEntryForm } from '@/components/DataEntryForm';
import { VoiceDebugPanel } from '@/components/voice/VoiceDebugPanel';

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
  const [searchQuery, setSearchQuery] = useState("");
  
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState<SavedEntry | null>(null);
  const [fillingEntry, setFillingEntry] = useState<SavedEntry | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [savedEntries, setSavedEntries] = useState<SavedEntry[]>([]);

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

  const handleAddEntry = () => {
    setShowAddEntry(true);
    setEditingEntry(null);
    setFillingEntry(null);
  };

  const handleEditEntry = (entry: SavedEntry) => {
    setEditingEntry(entry);
    setShowAddEntry(false);
    setFillingEntry(null);
  };

  const handleDeleteEntry = (id: string) => {
    setSavedEntries(prev => prev.filter(entry => entry.id !== id));
    toast.success('Entry deleted successfully');
  };

  const handleSaveEntry = (entry: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingEntry) {
      // Update existing entry
      const updatedEntry: SavedEntry = {
        ...editingEntry,
        ...entry,
        updatedAt: new Date(),
      };
      setSavedEntries(prev => prev.map(e => e.id === editingEntry.id ? updatedEntry : e));
      toast.success('Entry updated successfully');
    } else {
      // Create new entry
      const newEntry: SavedEntry = {
        ...entry,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setSavedEntries(prev => [...prev, newEntry]);
      toast.success('Entry saved successfully');
    }
    handleCancelEdit();
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
    setFillingEntry(null);
    setShowAddEntry(false);
  };

  const handleCategorySelect = (categoryName: string) => {
    setSelectedCategory(categoryName);
  };

  const handleAllEntriesSelect = () => {
    setSelectedCategory('All');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const getFormTitle = () => {
    if (editingEntry) return `Edit ${editingEntry.title}`;
    if (fillingEntry) return `Fill ${fillingEntry.title}`;
    return 'Add New Entry';
  };

  const getFormMode = (): 'create' | 'edit' | 'fill' => {
    if (editingEntry) return 'edit';
    if (fillingEntry) return 'fill';
    return 'create';
  };

  return (
    <DashboardLayout
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      userName={user?.user_metadata?.full_name || user?.email || 'User'}
      savedEntries={savedEntries}
      onAddEntry={handleAddEntry}
      onCategorySelect={handleCategorySelect}
      onAllEntriesSelect={handleAllEntriesSelect}
      onEditEntry={handleEditEntry}
      onDeleteEntry={handleDeleteEntry}
      onSaveEntry={handleSaveEntry}
      onCancelEdit={handleCancelEdit}
    >
      {(showAddEntry || editingEntry || fillingEntry) ? (
        <DataEntryForm
          mode={getFormMode()}
          editEntry={editingEntry}
          templateEntry={fillingEntry}
          onSave={handleSaveEntry}
          onCancel={handleCancelEdit}
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
          onSaveEntry={handleSaveEntry}
          onCancelEdit={handleCancelEdit}
          onCategorySelect={handleCategorySelect}
          onAddEntry={handleAddEntry}
          onCreateDocument={() => {}}
          onEnhancedVoiceInput={() => {}}
          onEditEntry={handleEditEntry}
          onFillEntry={(entry) => setFillingEntry(entry)}
        />
      )}
      
      {/* Debug panel for voice system monitoring */}
      <VoiceDebugPanel />
    </DashboardLayout>
  );
}
