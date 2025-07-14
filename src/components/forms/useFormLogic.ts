import { useState, useEffect } from "react";
import { SavedEntry, FieldDefinition } from "@/types/dashboard";
import { CustomField, CATEGORIES } from './types';

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
  const [fields, setFields] = useState<CustomField[]>([
    { id: '1', name: 'Description', type: 'textarea', value: '' }
  ]);

  // Track initial state to detect changes
  const [initialState, setInitialState] = useState<{
    title: string;
    selectedCategory: string;
    fields: CustomField[];
  }>({
    title: "",
    selectedCategory: preselectedCategory || "",
    fields: [{ id: '1', name: 'Description', type: 'textarea', value: '' }]
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
    let newFields: CustomField[] = [{ id: '1', name: 'Description', type: 'textarea', value: '' }];

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
            value: editEntry.fields[fieldDef.name] || ''
          }));
        newFields = editFields.length > 0 ? editFields : [{ id: '1', name: 'Description', type: 'textarea', value: '' }];
        
        console.log('Created fields from definitions:', newFields);
      } else {
        // Fallback: create fields from the fields object
        const editFields: CustomField[] = Object.entries(editEntry.fields)
          .filter(([name]) => name !== 'category')
          .map(([name, value], index) => ({
            id: (index + 1).toString(),
            name,
            type: (typeof value === 'number' ? 'number' : 
                   Array.isArray(value) ? 'gallery' :
                   typeof value === 'string' && value.length > 100 ? 'textarea' : 'text') as CustomField['type'],
            value
          }));
        newFields = editFields.length > 0 ? editFields : [{ id: '1', name: 'Description', type: 'textarea', value: '' }];
        
        console.log('Created fields from fields object:', newFields);
      }
    } else if (templateEntry && mode === 'fill') {
      console.log('Processing templateEntry for fill mode:', {
        title: templateEntry.title,
        fields: templateEntry.fields,
        fieldDefinitions: templateEntry.fieldDefinitions
      });

      newTitle = templateEntry.title;
      newCategory = templateEntry.fields.category || preselectedCategory || "";
      
      if (templateEntry.fieldDefinitions && templateEntry.fieldDefinitions.length > 0) {
        // Use field definitions but clear values for filling
        const templateFields: CustomField[] = templateEntry.fieldDefinitions
          .filter(fieldDef => fieldDef.name !== 'category')
          .map(fieldDef => ({
            ...fieldDef,
            value: templateEntry.fields[fieldDef.name] || '' // Keep existing values for fill mode
          }));
        newFields = templateFields.length > 0 ? templateFields : [{ id: '1', name: 'Description', type: 'textarea', value: '' }];
        
        console.log('Created template fields for fill mode:', newFields);
      } else {
        // Fallback: create fields from the fields object but keep values
        const templateFields: CustomField[] = Object.entries(templateEntry.fields)
          .filter(([name]) => name !== 'category')
          .map(([name, value], index) => ({
            id: (index + 1).toString(),
            name,
            type: (typeof value === 'number' ? 'number' : 
                   Array.isArray(value) ? 'gallery' :
                   typeof value === 'string' && value.length > 100 ? 'textarea' : 'text') as CustomField['type'],
            value: value || '' // Keep existing values for fill mode
          }));
        newFields = templateFields.length > 0 ? templateFields : [{ id: '1', name: 'Description', type: 'textarea', value: '' }];
        
        console.log('Created template fields from fields object:', newFields);
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

  const addField = () => {
    const newField: CustomField = {
      id: Date.now().toString(),
      name: '',
      type: 'text',
      value: ''
    };
    setFields([...fields, newField]);
  };

  const updateField = (id: string, key: keyof CustomField, value: any) => {
    console.log('Updating field:', { id, key, value });
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
      if (field.name && field.value !== undefined && field.value !== '') {
        fieldData[field.name] = field.value;
      }
      if (field.name) {
        fieldDefinitions.push({
          id: field.id,
          name: field.name,
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
