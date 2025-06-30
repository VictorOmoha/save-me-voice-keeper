
import { useState, useEffect } from "react";
import { SavedEntry } from "@/pages/Dashboard";
import { VoiceCommand } from "@/utils/voiceCommandProcessor";
import { toast } from "sonner";
import { speak } from "@/utils/textToSpeech";

export const useDashboard = () => {
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

  const bulkDeleteEntries = (ids: string[]) => {
    const updatedEntries = savedEntries.filter(entry => !ids.includes(entry.id));
    setSavedEntries(updatedEntries);
    localStorage.setItem('savedEntries', JSON.stringify(updatedEntries));
    toast.success(`${ids.length} entries deleted successfully!`);
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
        const createMessage = `Creating field "${command.params?.fieldName || 'New Field'}"`;
        toast.success(`Voice command: ${createMessage}`);
        speak(createMessage);
        break;
        
      case 'delete_entry':
        if (command.params?.entryTitle) {
          const entryToDelete = savedEntries.find(entry => 
            entry.title.toLowerCase().includes(command.params?.entryTitle?.toLowerCase() || '')
          );
          if (entryToDelete) {
            deleteEntry(entryToDelete.id);
            const deleteMessage = `Deleted entry: ${entryToDelete.title}`;
            toast.success(deleteMessage);
            speak(deleteMessage);
          } else {
            const errorMessage = `Entry "${command.params.entryTitle}" not found`;
            toast.error(errorMessage);
            speak(errorMessage);
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
            const openMessage = `Opening entry: ${entryToOpen.title}`;
            toast.success(openMessage);
            speak(openMessage);
          } else {
            const errorMessage = `Entry "${command.params.entryTitle}" not found`;
            toast.error(errorMessage);
            speak(errorMessage);
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
            const fillMessage = `Filling form: ${entryToFill.title}`;
            toast.success(fillMessage);
            speak(fillMessage);
          } else {
            const errorMessage = `Template "${command.params.entryTitle}" not found`;
            toast.error(errorMessage);
            speak(errorMessage);
          }
        }
        break;
        
      case 'save_entry':
        if (showAddEntry) {
          const saveMessage = 'Please fill out the form and click save to save the entry';
          toast.success('Voice command: Save the current entry');
          speak(saveMessage);
        } else {
          const noEntryMessage = 'No entry form is currently open';
          toast.info(noEntryMessage);
          speak(noEntryMessage);
        }
        break;
        
      case 'cancel':
        if (showAddEntry) {
          handleCancelEdit();
          const cancelMessage = 'Cancelled current action';
          toast.success('Voice command: Cancelled current action');
          speak(cancelMessage);
        } else {
          const noCancelMessage = 'No action to cancel';
          toast.info(noCancelMessage);
          speak(noCancelMessage);
        }
        break;
        
      default:
        console.log('Unknown command received, providing help message');
        const helpMessage = 'I can help you with commands like: Create field, Delete entry, Open entry, or Fill form. You can also say specific entry names like "Open Address Info".';
        toast.info('Voice command not recognized');
        speak(helpMessage);
    }
  };

  const handleAddEntry = () => {
    setShowAddEntry(true);
  };

  const handleVoiceResult = (text: string) => {
    toast.success(`Voice input received: "${text}"`);
    setShowAddEntry(true);
  };

  return {
    searchQuery,
    setSearchQuery,
    savedEntries,
    showAddEntry,
    setShowAddEntry,
    editingEntry,
    setEditingEntry,
    fillingEntry,
    setFillingEntry,
    saveEntry,
    deleteEntry,
    bulkDeleteEntries,
    editEntry,
    fillEntry,
    handleCancelEdit,
    getFormMode,
    getFormTitle,
    filteredEntries,
    handleVoiceCommand,
    handleAddEntry,
    handleVoiceResult,
  };
};
