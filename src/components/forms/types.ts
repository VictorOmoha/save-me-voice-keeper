
export interface TableColumn {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'checkbox';
  required?: boolean;
}

export interface TableData {
  columns: TableColumn[];
  rows: Record<string, any>[];
}

export interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'textarea' | 'image' | 'gallery' | 'table';
  value: any;
  index?: number;
}

export const CATEGORIES = [
  "Documents",
  "Health", 
  "Contacts",
  "Finance",
  "Personal"
];
