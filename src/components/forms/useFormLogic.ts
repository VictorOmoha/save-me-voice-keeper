import { useState, useEffect } from "react";
import { SavedEntry, FieldDefinition } from "@/types/dashboard";
import { CustomField, CATEGORIES } from './types';
import { normalizeToDbFieldName } from "@/utils/fieldNameNormalizer";

// Helper function to normalize field names for display
const normalizeFieldName = (name: string): string => {
  if (!name) return '';
  
  // Handle common cases and capitalize properly
  return name
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space before capital letters
    .replace(/_/g, ' ') // Replace underscores with spaces
    .replace(/\b\w/g, l => l.toUpperCase()) // Capitalize first letter of each word
    .trim();
};

// Helper function to detect field type from value
const detectFieldType = (value: any): CustomField['type'] => {
  if (typeof value === 'number') return 'number';
  if (Array.isArray(value)) return 'gallery';
  if (typeof value === 'object' && value !== null && 'columns' in value && 'rows' in value) return 'table';
  if (typeof value === 'string') {
    if (value.length > 100) return 'textarea';
    // Check if it's a date
    if (value.match(/^\d{4}-\d{2}-\d{2}/)) return 'date';
  }
  return 'text';
};

interface UseFormLogicProps {
  editEntry?: SavedEntry | null;
  templateEntry?: SavedEntry | null;
  mode?: 'create' | 'edit' | 'fill';
  preselectedCategory?: string;
}

export const useFormLogic = ({
  editEntry,
  templateEntry,
  mode = 'create',
  preselectedCategory
}: UseFormLogicProps) => {
  const [title, setTitle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(preselectedCategory || "");
  const [fields, setFields] = useState<CustomField[]>([]);

  // Track initial state to detect changes
  const [initialState, setInitialState] = useState<{
    title: string;
    selectedCategory: string;
    fields: CustomField[];
  }>({
    title: "",
    selectedCategory: preselectedCategory || "",
    fields: []
  });
  
  // Calculate if form is dirty (has changes)
  const isDirty = 
    title !== initialState.title ||
    selectedCategory !== initialState.selectedCategory ||
    JSON.stringify(fields) !== JSON.stringify(initialState.fields);

  useEffect(() => {
    console.log('useFormLogic useEffect triggered:', {
      editEntry: editEntry?.title,
      templateEntry: templateEntry?.title,
      mode,
      preselectedCategory
    });

    let newTitle = "";
    let newCategory = preselectedCategory || "";
    let newFields: CustomField[] = [];

    if (editEntry) {
      console.log('Processing editEntry:', {
        title: editEntry.title,
        fields: editEntry.fields,
        fieldDefinitions: editEntry.fieldDefinitions
      });

      newTitle = editEntry.title;
      newCategory = editEntry.fields.category || "";
      
      if (editEntry.fieldDefinitions && editEntry.fieldDefinitions.length > 0) {
        // Use field definitions to create fields with proper structure
        const editFields: CustomField[] = editEntry.fieldDefinitions
          .filter(fieldDef => fieldDef.name !== 'category')
          .map(fieldDef => ({
            ...fieldDef,
            name: normalizeFieldName(fieldDef.name), // Normalize display name
            value: editEntry.fields[fieldDef.name] || ''
          }));
        newFields = editFields.length > 0 ? editFields : [];
        
        console.log('Created fields from definitions with normalized names:', newFields);
      } else {
        // Fallback: create fields from the fields object with normalized names
        const editFields: CustomField[] = Object.entries(editEntry.fields)
          .filter(([name]) => name !== 'category')
          .map(([name, value], index) => ({
            id: (index + 1).toString(),
            name: normalizeFieldName(name), // Normalize display name
            type: detectFieldType(value),
            value
          }));
        newFields = editFields.length > 0 ? editFields : [];
        
        console.log('Created fields from fields object with normalized names:', newFields);
      }
    } else if (templateEntry && mode === 'fill') {
      console.log('Processing templateEntry for fill mode:', {
        title: templateEntry.title,
        fields: templateEntry.fields,
        fieldDefinitions: templateEntry.fieldDefinitions
      });

      newTitle = templateEntry.title; // Use template title as starting point
      newCategory = templateEntry.fields.category || preselectedCategory || "";
      
      if (templateEntry.fieldDefinitions && templateEntry.fieldDefinitions.length > 0) {
        // Use field definitions but clear values for filling
        const templateFields: CustomField[] = templateEntry.fieldDefinitions
          .filter(fieldDef => fieldDef.name !== 'category')
          .map(fieldDef => ({
            ...fieldDef,
            name: normalizeFieldName(fieldDef.name), // Normalize display name
            value: templateEntry.fields[fieldDef.name] || '' // Keep template values for easier editing
          }));
        newFields = templateFields.length > 0 ? templateFields : [];
        
        console.log('Created template fields for fill mode with normalized names and cleared values:', newFields);
      } else {
        // Fallback: create fields from the fields object but clear values
        const templateFields: CustomField[] = Object.entries(templateEntry.fields)
          .filter(([name]) => name !== 'category')
          .map(([name, value], index) => ({
            id: (index + 1).toString(),
            name: normalizeFieldName(name), // Normalize display name
            type: detectFieldType(value),
            value: value || '' // Keep template values for easier editing
          }));
        newFields = templateFields.length > 0 ? templateFields : [];
        
        console.log('Created template fields from fields object with normalized names and cleared values:', newFields);
      }
    }

    console.log('Final form state:', {
      newTitle,
      newCategory,
      newFields
    });

    // Set form state
    setTitle(newTitle);
    setSelectedCategory(newCategory);
    setFields(newFields);

    // Set initial state for dirty tracking
    setInitialState({
      title: newTitle,
      selectedCategory: newCategory,
      fields: newFields
    });
  }, [editEntry, templateEntry, mode, preselectedCategory]);

  const addField = (initial?: Partial<CustomField>): string => {
    // Ensure we only use valid field types
    const validTypes: CustomField['type'][] = ['text', 'number', 'date', 'textarea', 'image', 'gallery', 'table'];
    let fieldType: CustomField['type'] = 'text';
    
    if (initial?.type && validTypes.includes(initial.type as CustomField['type'])) {
      fieldType = initial.type as CustomField['type'];
    }
    
    const newField: CustomField = {
      id: Date.now().toString(),
      name: initial?.name ?? '',
      type: fieldType,
      value: initial?.value ?? ''
    };
    console.log('Adding new field:', newField);
    setFields(prev => [...prev, newField]);
    return newField.id;
  };
  const updateField = (id: string, key: keyof CustomField, value: any) => {
    console.log('Updating field:', { id, key, value });
    
    // Validate field type if we're updating the type
    if (key === 'type') {
      const validTypes: CustomField['type'][] = ['text', 'number', 'date', 'textarea', 'image', 'gallery', 'table'];
      if (!validTypes.includes(value)) {
        console.error('Invalid field type provided:', value, 'Valid types:', validTypes);
        return; // Don't update with invalid type
      }
    }
    
    setFields(fields.map(field => 
      field.id === id ? { ...field, [key]: value } : field
    ));
  };

  const removeField = (id: string) => {
    setFields(fields.filter(field => field.id !== id));
  };

  const moveField = (id: string, direction: 'up' | 'down') => {
    const currentIndex = fields.findIndex(field => field.id === id);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= fields.length) return;
    
    const newFields = [...fields];
    [newFields[currentIndex], newFields[newIndex]] = [newFields[newIndex], newFields[currentIndex]];
    setFields(newFields);
  };

  const prepareSubmissionData = () => {
    const fieldData: Record<string, any> = {
      category: selectedCategory
    };
    const fieldDefinitions: FieldDefinition[] = [
      { id: 'category', name: 'category', type: 'text' }
    ];
    
    fields.forEach(field => {
      if (field.name && field.name.trim() !== '') {
        // Convert display name back to a database-friendly format
        const dbFieldName = normalizeToDbFieldName(field.name);
        const value = field.value ?? '';
        // Skip default empty description field
        if (dbFieldName === 'description' && (value === '' || (typeof value === 'string' && value.trim() === ''))) {
          return;
        }
        fieldData[dbFieldName] = value;
        
        fieldDefinitions.push({
          id: field.id,
          name: dbFieldName, // Store the database-friendly name
          type: field.type
        });
      }
    });

    console.log('Prepared submission data:', {
      title: title || 'Untitled Entry',
      fields: fieldData,
      fieldDefinitions: fieldDefinitions
    });

    return {
      title: title || 'Untitled Entry',
      fields: fieldData,
      fieldDefinitions: fieldDefinitions
    };
  };

  return {
    title,
    setTitle,
    selectedCategory,
    setSelectedCategory,
    fields,
    addField,
    updateField,
    removeField,
    moveField,
    prepareSubmissionData,
    categories: CATEGORIES,
    isDirty
  };
};
