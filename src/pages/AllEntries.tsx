import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus } from "lucide-react";
import { EntriesTable } from "@/components/EntriesTable";
import { DataEntryForm } from "@/components/DataEntryForm";
import { DashboardHeader } from "@/components/DashboardHeader";
import { SavedEntry } from "@/types/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function AllEntries() {
  const [entries, setEntries] = useState<SavedEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState<SavedEntry | null>(null);

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
        // Create new entry
        const newEntry: SavedEntry = {
          ...entryData,
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
      setEditingEntry(null);
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

  const handleBulkDelete = (ids: string[]) => {
    try {
      const updatedEntries = entries.filter(entry => !ids.includes(entry.id));
      setEntries(updatedEntries);
      localStorage.setItem('savedEntries', JSON.stringify(updatedEntries));
      toast.success(`${ids.length} entries deleted successfully!`);
    } catch (error) {
      console.error('Error deleting entries:', error);
      toast.error("Failed to delete entries");
    }
  };

  const handleEditEntry = (entry: SavedEntry) => {
    setEditingEntry(entry);
    setShowAddEntry(true);
  };

  const handleFillEntry = (entry: SavedEntry) => {
    // Create a new entry based on the template
    setEditingEntry(null);
    setShowAddEntry(true);
    // You could pre-populate the form with the entry template here
  };

  const handleCancelEdit = () => {
    setShowAddEntry(false);
    setEditingEntry(null);
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
              <h1 className="text-2xl font-bold">All Entries</h1>
              <p className="text-muted-foreground">
                {filteredEntries.length} {filteredEntries.length === 1 ? 'entry' : 'entries'} total
              </p>
            </div>
          </div>
          
          <Button onClick={() => setShowAddEntry(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
          </Button>
        </div>

        {/* Add/Edit Entry Form */}
        {showAddEntry && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                {editingEntry ? 'Edit Entry' : 'Add New Entry'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DataEntryForm 
                onSave={handleSaveEntry}
                onCancel={handleCancelEdit}
                editEntry={editingEntry}
                mode={editingEntry ? 'edit' : 'create'}
              />
            </CardContent>
          </Card>
        )}

        {/* Entries Table */}
        <EntriesTable
          entries={filteredEntries}
          onDelete={handleDeleteEntry}
          onEdit={handleEditEntry}
          onFill={handleFillEntry}
          onBulkDelete={handleBulkDelete}
        />
      </div>
    </div>
  );
}