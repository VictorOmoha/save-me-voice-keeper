
export interface FieldDefinition {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'textarea' | 'image' | 'gallery' | 'table';
}

export interface SavedEntry {
  id: string;
  title: string;
  fields: Record<string, any>;
  fieldDefinitions?: FieldDefinition[];
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}
