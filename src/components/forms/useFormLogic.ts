
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

  useEffect(() => {
    if (editEntry) {
      setTitle(editEntry.title);
      setSelectedCategory(editEntry.fields.category || "");
      if (editEntry.fieldDefinitions && editEntry.fieldDefinitions.length > 0) {
        const editFields: CustomField[] = editEntry.fieldDefinitions
          .filter(fieldDef => fieldDef.name !== 'category')
          .map(fieldDef => ({
            ...fieldDef,
            value: editEntry.fields[fieldDef.name] || ''
          }));
        setFields(editFields.length > 0 ? editFields : [{ id: '1', name: 'Description', type: 'textarea', value: '' }]);
      } else {
        const editFields: CustomField[] = Object.entries(editEntry.fields)
          .filter(([name]) => name !== 'category')
          .map(([name, value], index) => ({
            id: (index + 1).toString(),
            name,
            type: typeof value === 'number' ? 'number' : 'text',
            value
          }));
        setFields(editFields.length > 0 ? editFields : [{ id: '1', name: 'Description', type: 'textarea', value: '' }]);
      }
    } else if (templateEntry && mode === 'fill') {
      setTitle(`${templateEntry.title} - ${new Date().toLocaleDateString()}`);
      setSelectedCategory(templateEntry.fields.category || preselectedCategory || "");
      if (templateEntry.fieldDefinitions && templateEntry.fieldDefinitions.length > 0) {
        const templateFields: CustomField[] = templateEntry.fieldDefinitions
          .filter(fieldDef => fieldDef.name !== 'category')
          .map(fieldDef => ({
            ...fieldDef,
            value: ''
          }));
        setFields(templateFields.length > 0 ? templateFields : [{ id: '1', name: 'Description', type: 'textarea', value: '' }]);
      } else {
        const templateFields: CustomField[] = Object.entries(templateEntry.fields)
          .filter(([name]) => name !== 'category')
          .map(([name, value], index) => ({
            id: (index + 1).toString(),
            name,
            type: typeof value === 'number' ? 'number' : 'text',
            value: ''
          }));
        setFields(templateFields.length > 0 ? templateFields : [{ id: '1', name: 'Description', type: 'textarea', value: '' }]);
      }
    } else if (preselectedCategory) {
      setSelectedCategory(preselectedCategory);
    }
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
      if (field.name && field.value !== undefined) {
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
    categories: CATEGORIES
  };
};
