import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { VoiceInput } from "@/components/VoiceInput";
import { DataEntryForm } from "@/components/DataEntryForm";
import { SavedEntriesList } from "@/components/SavedEntriesList";
import { toast } from "sonner";
import { VoiceCommand } from "@/utils/voiceCommandProcessor";

export interface FieldDefinition {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'textarea';
}

export interface SavedEntry {
  id: string;
  title: string;
  fields: Record<string, any>;
  fieldDefinitions?: FieldDefinition[]; // Add this to store form structure
  createdAt: Date;
  updatedAt: Date;
}

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [savedEntries, setSavedEntries] = useState<SavedEntry[]>([]);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState<SavedEntry | null>(null);
  const [fillingEntry, setFillingEntry] = useState<SavedEntry | null>(null);

  useEffect(() => {
    // Load saved entries from localStorage
    const entries = localStorage.getItem('savedEntries');
    if (entries) {
      setSavedEntries(JSON.parse(entries));
    }
  }, []);

  const saveEntry = (entry: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingEntry) {
      // Update existing entry
      const updatedEntry: SavedEntry = {
        ...editingEntry,
        ...entry,
        updatedAt: new Date()
      };
      
      const updatedEntries = savedEntries.map(e => 
        e.id === editingEntry.id ? updatedEntry : e
      );
      setSavedEntries(updatedEntries);
      localStorage.setItem('savedEntries', JSON.stringify(updatedEntries));
      toast.success("Entry updated successfully!");
      setEditingEntry(null);
    } else {
      // Create new entry
      const newEntry: SavedEntry = {
        ...entry,
        id: Date.now().toString(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const updatedEntries = [newEntry, ...savedEntries];
      setSavedEntries(updatedEntries);
      localStorage.setItem('savedEntries', JSON.stringify(updatedEntries));
      toast.success("Entry saved successfully!");
    }
    setShowAddEntry(false);
  };

  const deleteEntry = (id: string) => {
    const updatedEntries = savedEntries.filter(entry => entry.id !== id);
    setSavedEntries(updatedEntries);
    localStorage.setItem('savedEntries', JSON.stringify(updatedEntries));
    toast.success("Entry deleted successfully!");
  };

  const editEntry = (entry: SavedEntry) => {
    setEditingEntry(entry);
    setFillingEntry(null);
    setShowAddEntry(true);
  };

  const fillEntry = (entry: SavedEntry) => {
    setFillingEntry(entry);
    setEditingEntry(null);
    setShowAddEntry(true);
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
    setFillingEntry(null);
    setShowAddEntry(false);
  };

  const getFormMode = () => {
    if (editingEntry) return 'edit';
    if (fillingEntry) return 'fill';
    return 'create';
  };

  const getFormTitle = () => {
    if (editingEntry) return 'Edit Entry';
    if (fillingEntry) return `Fill Form: ${fillingEntry.title}`;
    return 'Add New Entry';
  };

  const filteredEntries = savedEntries.filter(entry =>
    entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    Object.values(entry.fields).some(value =>
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleVoiceCommand = (command: VoiceCommand) => {
    console.log('Executing voice command:', command);
    
    switch (command.type) {
      case 'create_field':
        // Open the add entry form
        setShowAddEntry(true);
        setEditingEntry(null);
        setFillingEntry(null);
        toast.success(`Voice command: Creating field "${command.params?.fieldName || 'New Field'}"`);
        break;
        
      case 'delete_entry':
        if (command.params?.entryTitle) {
          const entryToDelete = savedEntries.find(entry => 
            entry.title.toLowerCase().includes(command.params?.entryTitle?.toLowerCase() || '')
          );
          if (entryToDelete) {
            deleteEntry(entryToDelete.id);
            toast.success(`Deleted entry: ${entryToDelete.title}`);
          } else {
            toast.error(`Entry "${command.params.entryTitle}" not found`);
          }
        }
        break;
        
      case 'open_entry':
        if (command.params?.entryTitle) {
          const entryToOpen = savedEntries.find(entry => 
            entry.title.toLowerCase().includes(command.params?.entryTitle?.toLowerCase() || '')
          );
          if (entryToOpen) {
            editEntry(entryToOpen);
            toast.success(`Opening entry: ${entryToOpen.title}`);
          } else {
            toast.error(`Entry "${command.params.entryTitle}" not found`);
          }
        }
        break;
        
      case 'fill_form':
        if (command.params?.entryTitle) {
          const entryToFill = savedEntries.find(entry => 
            entry.title.toLowerCase().includes(command.params?.entryTitle?.toLowerCase() || '')
          );
          if (entryToFill) {
            fillEntry(entryToFill);
            toast.success(`Filling form: ${entryToFill.title}`);
          } else {
            toast.error(`Template "${command.params.entryTitle}" not found`);
          }
        }
        break;
        
      case 'save_entry':
        if (showAddEntry) {
          // The form will handle the save action
          toast.success('Voice command: Save the current entry');
        } else {
          toast.info('No entry form is currently open');
        }
        break;
        
      case 'cancel':
        if (showAddEntry) {
          handleCancelEdit();
          toast.success('Voice command: Cancelled current action');
        } else {
          toast.info('No action to cancel');
        }
        break;
        
      default:
        toast.info('Voice command not recognized. Try: "Create field", "Delete entry [name]", "Open entry [name]"');
    }
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600">
            What would you like to save today?
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setShowAddEntry(true)}>
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">➕</span>
              </div>
              <CardTitle className="text-lg">Add New Entry</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-center">Quickly save any information</p>
            </CardContent>
          </Card>

          <VoiceInput 
            onVoiceResult={(text) => {
              toast.success(`Voice input received: "${text}"`);
              setShowAddEntry(true);
            }}
            onVoiceCommand={handleVoiceCommand}
          />

          <Card>
            <CardHeader className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">📊</span>
              </div>
              <CardTitle className="text-lg">Your Stats</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">{savedEntries.length}</div>
              <p className="text-gray-600">Entries saved</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <Input
            placeholder="🔍 Search your saved information..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Add/Edit Entry Form */}
        {showAddEntry && (
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle>{getFormTitle()}</CardTitle>
              </CardHeader>
              <CardContent>
                <DataEntryForm 
                  onSave={saveEntry}
                  onCancel={handleCancelEdit}
                  editEntry={editingEntry}
                  templateEntry={fillingEntry}
                  mode={getFormMode()}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Saved Entries */}
        <SavedEntriesList 
          entries={filteredEntries}
          onDelete={deleteEntry}
          onEdit={editEntry}
          onFill={fillEntry}
        />
      </div>
    </div>
  );
};

export default Dashboard;
