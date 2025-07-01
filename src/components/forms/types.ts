
export interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'textarea';
  value: any;
}

export const CATEGORIES = [
  "Documents",
  "Health", 
  "Contacts",
  "Finance",
  "Personal"
];
