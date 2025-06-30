
import { SavedEntry, FieldDefinition } from "@/pages/Dashboard";

interface CategoryEntryCreatorProps {
  categoryName: string;
  onShowDocumentCreator: () => void;
  onSetFillingEntry: (entry: SavedEntry) => void;
  onSetEditingEntry: (entry: SavedEntry | null) => void;
  onSetShowAddEntry: (show: boolean) => void;
}

export const CategoryEntryCreator = ({
  categoryName,
  onShowDocumentCreator,
  onSetFillingEntry,
  onSetEditingEntry,
  onSetShowAddEntry,
}: CategoryEntryCreatorProps) => {
  const handleCreateEntryForCategory = (categoryName: string) => {
    if (categoryName === "Documents") {
      onShowDocumentCreator();
    } else {
      // For other categories, use the regular add entry form with category pre-filled
      onSetFillingEntry({
        id: 'template',
        title: `New ${categoryName.slice(0, -1)}`,
        fields: {
          category: categoryName,
          // Add default fields based on category
          ...(categoryName === "Health" && {
            doctor: '',
            condition: '',
            medication: '',
            date: '',
            notes: ''
          }),
          ...(categoryName === "Contacts" && {
            name: '',
            phone: '',
            email: '',
            address: '',
            relationship: ''
          }),
          ...(categoryName === "Finance" && {
            accountType: '',
            institution: '',
            accountNumber: '',
            balance: '',
            notes: ''
          }),
          ...(categoryName === "Personal" && {
            type: '',
            description: '',
            value: '',
            location: '',
            notes: ''
          })
        },
        fieldDefinitions: [
          { id: '1', name: 'category', type: 'text' as const },
          // Add field definitions based on category
          ...(categoryName === "Health" ? [
            { id: '2', name: 'doctor', type: 'text' as const },
            { id: '3', name: 'condition', type: 'text' as const },
            { id: '4', name: 'medication', type: 'text' as const },
            { id: '5', name: 'date', type: 'date' as const },
            { id: '6', name: 'notes', type: 'textarea' as const }
          ] : []),
          ...(categoryName === "Contacts" ? [
            { id: '2', name: 'name', type: 'text' as const },
            { id: '3', name: 'phone', type: 'text' as const },
            { id: '4', name: 'email', type: 'text' as const },
            { id: '5', name: 'address', type: 'textarea' as const },
            { id: '6', name: 'relationship', type: 'text' as const }
          ] : []),
          ...(categoryName === "Finance" ? [
            { id: '2', name: 'accountType', type: 'text' as const },
            { id: '3', name: 'institution', type: 'text' as const },
            { id: '4', name: 'accountNumber', type: 'text' as const },
            { id: '5', name: 'balance', type: 'number' as const },
            { id: '6', name: 'notes', type: 'textarea' as const }
          ] : []),
          ...(categoryName === "Personal" ? [
            { id: '2', name: 'type', type: 'text' as const },
            { id: '3', name: 'description', type: 'textarea' as const },
            { id: '4', name: 'value', type: 'text' as const },
            { id: '5', name: 'location', type: 'text' as const },
            { id: '6', name: 'notes', type: 'textarea' as const }
          ] : [])
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      onSetEditingEntry(null);
      onSetShowAddEntry(true);
    }
  };

  return { handleCreateEntryForCategory };
};
