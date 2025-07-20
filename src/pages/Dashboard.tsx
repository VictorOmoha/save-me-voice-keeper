import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { toast } from 'sonner';

import { SavedEntry } from '@/types/dashboard';
import { categories } from '@/constants/categories';
import { useEntries } from '@/hooks/useEntries';
import { DashboardHeader } from '@/components/DashboardHeader';
import { CategoriesPanel } from '@/components/CategoriesPanel';
import { DashboardMainContent } from '@/components/DashboardMainContent';
import { AddEntryModal } from '@/components/modals/AddEntryModal';
import { EditEntryModal } from '@/components/modals/EditEntryModal';
import { FillTemplateModal } from '@/components/modals/FillTemplateModal';
import { ConversationalVoiceInterface } from '@/components/ConversationalVoiceInterface';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const router = useRouter();

  const [showAddEntry, setShowAddEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState<SavedEntry | null>(null);
  const [fillingEntry, setFillingEntry] = useState<SavedEntry | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const {
    savedEntries,
    saveEntry,
    deleteEntry,
    editEntry,
    fillEntry,
    entryCounts,
  } = useEntries(user?.email || '');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const logout = async () => {
    await signOut();
    router.push('/');
    toast.success('Logged out successfully');
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
    setFillingEntry(null);
    setShowAddEntry(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        <DashboardHeader 
          userName={user?.user_metadata?.full_name || user?.email || 'User'}
          onLogout={logout}
        />

        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="space-y-4">
              <CategoriesPanel 
                categories={categories}
                selectedCategory={selectedCategory}
                onCategorySelect={setSelectedCategory}
                entryCounts={entryCounts}
              />
              
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
            <DashboardMainContent
              savedEntries={savedEntries}
              selectedCategory={selectedCategory}
              deleteEntry={deleteEntry}
              editEntry={setEditingEntry}
              fillEntry={setFillingEntry}
              showAddEntry={showAddEntry}
              setShowAddEntry={setShowAddEntry}
            />
          </div>
        </div>

        <AddEntryModal
          isOpen={showAddEntry}
          onClose={() => setShowAddEntry(false)}
          onSave={saveEntry}
          onCancel={handleCancelEdit}
        />

        <EditEntryModal
          isOpen={!!editingEntry}
          onClose={() => setEditingEntry(null)}
          onSave={saveEntry}
          onCancel={handleCancelEdit}
          editEntry={editingEntry}
        />

        <FillTemplateModal
          isOpen={!!fillingEntry}
          onClose={() => setFillingEntry(null)}
          onSave={saveEntry}
          onCancel={handleCancelEdit}
          templateEntry={fillingEntry}
        />
      </div>
    </div>
  );
}
