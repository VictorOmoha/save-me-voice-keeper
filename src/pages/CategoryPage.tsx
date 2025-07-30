import { useState, useEffect } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import { CategoryView } from "@/components/CategoryView";
import { DashboardHeader } from "@/components/DashboardHeader";
import { SavedEntry } from "@/types/dashboard";
import { toast } from "sonner";

const VALID_CATEGORIES = ['Documents', 'Health', 'Contacts', 'Finance', 'Personal'];

export default function CategoryPage() {
  const { categoryName } = useParams<{ categoryName: string }>();
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

  const loadEntries = () => {
    try {
      const saved = localStorage.getItem('savedEntries');
      const loadedEntries = saved ? JSON.parse(saved) : [];
      setEntries(loadedEntries);
    } catch (error) {
      console.error('Error loading entries:', error);
      toast.error("Failed to load entries");
    }
  };

  const handleSaveEntry = (entryData: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      let updatedEntries;
      if (editingEntry) {
        // Update existing entry
        updatedEntries = entries.map(entry =>
          entry.id === editingEntry.id
            ? { ...entry, ...entryData, updatedAt: new Date() }
            : entry
        );
        toast.success("Entry updated successfully!");
      } else {
        // Create new entry with category pre-filled
        const newEntry: SavedEntry = {
          ...entryData,
          fields: {
            ...entryData.fields,
            category: categoryName,
          },
          id: Date.now().toString(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        updatedEntries = [...entries, newEntry];
        toast.success("Entry created successfully!");
      }

      setEntries(updatedEntries);
      localStorage.setItem('savedEntries', JSON.stringify(updatedEntries));
      setShowAddEntry(false);
      setShowDocumentCreator(false);
      setEditingEntry(null);
      setFillingEntry(null);
    } catch (error) {
      console.error('Error saving entry:', error);
      toast.error("Failed to save entry");
    }
  };

  const handleDeleteEntry = (id: string) => {
    try {
      const updatedEntries = entries.filter(entry => entry.id !== id);
      setEntries(updatedEntries);
      localStorage.setItem('savedEntries', JSON.stringify(updatedEntries));
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
              <h1 className="text-2xl font-bold">{categoryName}</h1>
              <p className="text-muted-foreground">
                Manage your {categoryName.toLowerCase()} entries
              </p>
            </div>
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
      </div>
    </div>
  );
}