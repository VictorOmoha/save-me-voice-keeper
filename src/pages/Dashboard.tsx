
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

import { SavedEntry } from '@/types/dashboard';
import { DashboardHeader } from '@/components/DashboardHeader';
import { CategoriesPanel } from '@/components/CategoriesPanel';
import { DashboardMainContent } from '@/components/DashboardMainContent';
import { ConversationalVoiceInterface } from '@/components/ConversationalVoiceInterface';

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

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Error signing out');
    } else {
      navigate('/login');
      toast.success('Logged out successfully');
    }
  };

  const saveEntry = (entry: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newEntry: SavedEntry = {
      ...entry,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setSavedEntries(prev => [...prev, newEntry]);
    toast.success('Entry saved successfully');
  };

  const deleteEntry = (id: string) => {
    setSavedEntries(prev => prev.filter(entry => entry.id !== id));
    toast.success('Entry deleted successfully');
  };

  const editEntry = (entry: SavedEntry) => {
    setEditingEntry(entry);
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
    setFillingEntry(null);
    setShowAddEntry(false);
  };

  const entryCounts = categories.reduce((acc, category) => {
    acc[category.name] = savedEntries.filter(entry => 
      (entry.fields.category || 'Personal') === category.name
    ).length;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        <DashboardHeader 
          userName={user?.user_metadata?.full_name || user?.email || 'User'}
          searchQuery=""
          onSearchChange={() => {}}
        />

        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-border bg-card">
                <h3 className="text-sm font-medium text-card-foreground mb-3">Categories</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category.name}
                      onClick={() => setSelectedCategory(category.name)}
                      className={`w-full text-left p-2 rounded-md transition-colors ${
                        selectedCategory === category.name
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {category.icon} {category.name}
                        </span>
                        <span className="text-xs opacity-60">
                          {entryCounts[category.name] || 0}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="p-4 rounded-lg border border-border bg-card">
                <h3 className="text-sm font-medium text-card-foreground mb-3">Voice Assistant</h3>
                <ConversationalVoiceInterface
                  savedEntries={savedEntries}
                  onCreateEntry={() => setShowAddEntry(true)}
                  onEditEntry={editEntry}
                  onDeleteEntry={deleteEntry}
                  onSaveEntry={saveEntry}
                  onCancelEdit={handleCancelEdit}
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="p-6 rounded-lg border border-border bg-card">
              <h2 className="text-xl font-semibold mb-4">
                {selectedCategory === 'All' ? 'All Entries' : selectedCategory}
              </h2>
              <p className="text-muted-foreground">
                {savedEntries.length === 0 
                  ? 'No entries yet. Create your first entry using the voice assistant or add entry button.'
                  : `${savedEntries.length} entries total`
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
