import { useState, useEffect, useCallback } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CategoryView } from "@/components/CategoryView";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { SavedEntry } from "@/types/dashboard";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from "firebase/firestore";
import { toast } from "sonner";
import { logDebug, logError } from "@/utils/logger";

const VALID_CATEGORIES = ['Documents', 'Health', 'Contacts', 'Finance', 'Personal'];

export default function CategoryPage() {
  const { categoryName } = useParams<{ categoryName: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
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

  const loadEntries = useCallback(async () => {
    if (authLoading) return;

    if (!user) {
      logError('No authenticated user');
      setEntries([]);
      return;
    }

    try {

      const entriesRef = collection(db, 'entries');
      const q = query(
        entriesRef,
        where('user_id', '==', user.uid),
        orderBy('created_at', 'desc')
      );

      const querySnapshot = await getDocs(q);

      const formattedEntries: SavedEntry[] = querySnapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          title: data.title,
          fields: data.fields || {},
          fieldDefinitions: data.field_definitions || undefined,
          createdAt: data.created_at?.toDate() || new Date(),
          updatedAt: data.updated_at?.toDate() || new Date()
        };
      });

      setEntries(formattedEntries);
    } catch (error) {
      logError('Error loading entries:', error);
      toast.error("Failed to load entries");
      setEntries([]);
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!authLoading && user) {
      loadEntries();
    }
  }, [user, authLoading, loadEntries]);

  const handleSaveEntry = async (entryData: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) {
      toast.error("You must be logged in to save entries");
      return;
    }

    try {
      if (editingEntry) {
        // Update existing entry
        const entryRef = doc(db, 'entries', editingEntry.id);
        await updateDoc(entryRef, {
          title: entryData.title,
          fields: entryData.fields,
          field_definitions: entryData.fieldDefinitions || null,
          updated_at: serverTimestamp()
        });

        toast.success("Entry updated successfully!");
      } else {
        // Create new entry with category pre-filled

        const entriesRef = collection(db, 'entries');
        await addDoc(entriesRef, {
          title: entryData.title,
          fields: {
            ...entryData.fields,
            category: categoryName,
          },
          field_definitions: entryData.fieldDefinitions || null,
          user_id: user.uid,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });

        toast.success("Entry created successfully!");
      }

      await loadEntries(); // Reload entries from database
      setShowAddEntry(false);
      setShowDocumentCreator(false);
      setEditingEntry(null);
      setFillingEntry(null);
    } catch (error) {
      logError('Error saving entry:', error);
      toast.error("Failed to save entry");
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      const entryRef = doc(db, 'entries', id);
      await deleteDoc(entryRef);

      await loadEntries(); // Reload entries from database
      toast.success("Entry deleted successfully!");
    } catch (error) {
      logError('Error deleting entry:', error);
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
    logDebug('Creating entry for category:', selectedCategory);
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
