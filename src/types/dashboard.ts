
export interface FieldDefinition {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'textarea' | 'image' | 'gallery';
}

export interface SavedEntry {
  id: string;
  title: string;
  fields: Record<string, any>;
  fieldDefinitions?: FieldDefinition[];
  createdAt: Date;
  updatedAt: Date;
}
