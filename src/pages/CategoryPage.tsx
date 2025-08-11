import { useState, useEffect } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CategoryView } from "@/components/CategoryView";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { SavedEntry } from "@/types/dashboard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const VALID_CATEGORIES = ['Documents', 'Health', 'Contacts', 'Finance', 'Personal'];

export default function CategoryPage() {
  const { categoryName } = useParams<{ categoryName: string }>();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<SavedEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [showDocumentCreator, setShowDocumentCreator] = useState(false);
  const [editingEntry, setEditingEntry] = useState<SavedEntry | null>(null);
  const [fillingEntry, setFillingEntry] = useState<SavedEntry | null>(null);

  // Validate category name
  if (!categoryName || !VALID_CATEGORIES.includes(categoryName)) {
    return <Navigate to="/dashboard" replace />;
  }

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      const { data: entries, error } = await supabase
        .from('entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading entries:', error);
        toast.error('Failed to load entries');
        setEntries([]);
        return;
      }

      const entriesArray = entries || [];
      const formattedEntries: SavedEntry[] = entriesArray.map(entry => ({
        id: entry.id,
        title: entry.title,
        fields: (entry.fields as Record<string, any>) || {},
        fieldDefinitions: entry.field_definitions as any || undefined,
        createdAt: new Date(entry.created_at),
        updatedAt: new Date(entry.updated_at)
      }));

      setEntries(formattedEntries);
    } catch (error) {
      console.error('Error loading entries:', error);
      toast.error("Failed to load entries");
      setEntries([]);
    }
  };

  const handleSaveEntry = async (entryData: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingEntry) {
        // Update existing entry
        const { error } = await supabase
          .from('entries')
          .update({
            title: entryData.title,
            fields: entryData.fields,
            field_definitions: entryData.fieldDefinitions as any,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingEntry.id);

        if (error) throw error;
        toast.success("Entry updated successfully!");
      } else {
        // Create new entry with category pre-filled
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error } = await supabase
          .from('entries')
          .insert({
            title: entryData.title,
            fields: {
              ...entryData.fields,
              category: categoryName,
            },
            field_definitions: entryData.fieldDefinitions as any,
            user_id: user.id
          });

        if (error) throw error;
        toast.success("Entry created successfully!");
      }

      await loadEntries(); // Reload entries from database
      setShowAddEntry(false);
      setShowDocumentCreator(false);
      setEditingEntry(null);
      setFillingEntry(null);
    } catch (error) {
      console.error('Error saving entry:', error);
      toast.error("Failed to save entry");
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('entries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await loadEntries(); // Reload entries from database
      toast.success("Entry deleted successfully!");
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error("Failed to delete entry");
    }
  };

  const handleEditEntry = (entry: SavedEntry) => {
    setEditingEntry(entry);
    setFillingEntry(null);
    setShowDocumentCreator(false);
    setShowAddEntry(true);
  };

  const handleFillEntry = (entry: SavedEntry) => {
    setFillingEntry(entry);
    setEditingEntry(null);
    setShowDocumentCreator(false);
    setShowAddEntry(true);
  };

  const handleCreateEntry = (selectedCategory: string) => {
    console.log('Creating entry for category:', selectedCategory);
    setEditingEntry(null);
    setFillingEntry(null);
    setShowDocumentCreator(false);
    setShowAddEntry(true);
  };

  const handleCancelEdit = () => {
    setShowAddEntry(false);
    setShowDocumentCreator(false);
    setEditingEntry(null);
    setFillingEntry(null);
  };

  const getFormTitle = () => {
    if (editingEntry) return `Edit ${editingEntry.title}`;
    if (fillingEntry) return `Fill Template: ${fillingEntry.title}`;
    return `Add New ${categoryName} Entry`;
  };

  const getFormMode = (): 'create' | 'edit' | 'fill' => {
    if (editingEntry) return 'edit';
    if (fillingEntry) return 'fill';
    return 'create';
  };

  const filteredEntries = entries.filter(entry =>
    entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    Object.values(entry.fields).some(field =>
      String(field).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <DashboardLayout
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      savedEntries={entries}
      onAddEntry={() => handleCreateEntry(categoryName)}
      onCategorySelect={(name) => navigate(`/category/${encodeURIComponent(name)}`)}
      onAllEntriesSelect={() => navigate(`/all-entries`)}
      onEditEntry={handleEditEntry as any}
      onDeleteEntry={handleDeleteEntry}
      onSaveEntry={handleSaveEntry as any}
      onCancelEdit={handleCancelEdit}
      onFillEntry={handleFillEntry as any}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{categoryName}</h1>
          <p className="text-muted-foreground">Manage your {categoryName.toLowerCase()} entries</p>
        </div>
        <Button onClick={() => handleCreateEntry(categoryName)}>
          <Plus className="h-4 w-4 mr-2" />
          Add {categoryName} Entry
        </Button>
      </div>

      <CategoryView
        categoryName={categoryName}
        entries={filteredEntries}
        onBack={() => {}}
        onEdit={handleEditEntry}
        onDelete={handleDeleteEntry}
        onFill={handleFillEntry}
        onCreateEntry={handleCreateEntry}
        showDocumentCreator={showDocumentCreator}
        showAddEntry={showAddEntry}
        editingEntry={editingEntry}
        fillingEntry={fillingEntry}
        onDocumentSave={handleSaveEntry}
        onDocumentCancel={handleCancelEdit}
        onSaveEntry={handleSaveEntry}
        onCancelEdit={handleCancelEdit}
        getFormTitle={getFormTitle}
        getFormMode={getFormMode}
      />
    </DashboardLayout>
  );
}