
export interface CustomField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'textarea' | 'image' | 'gallery';
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
