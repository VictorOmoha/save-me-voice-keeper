
export type FieldType = 'text' | 'number' | 'date' | 'textarea' | 'image' | 'gallery' | 'table';

export interface FieldDefinition {
  id: string;
  name: string;
  type: FieldType;
}

// Represents a single cell in a table field
export interface TableCell {
  value: string;
}

// Represents a row in a table field
export interface TableRow {
  cells: TableCell[];
}

// Table field value structure
export interface TableFieldValue {
  headers: string[];
  rows: TableRow[];
}

// Image field value structure
export interface ImageFieldValue {
  url: string;
  name?: string;
  size?: number;
}

// Gallery field value structure (array of images)
export type GalleryFieldValue = ImageFieldValue[];

// Union type for all possible field values
export type FieldValue =
  | string
  | number
  | boolean
  | Date
  | TableFieldValue
  | ImageFieldValue
  | GalleryFieldValue
  | null;

// Type-safe field record
export type FieldRecord = Record<string, FieldValue>;

export interface ActionItem {
  text: string;
  priority?: 'high' | 'medium' | 'low';
  due_date?: string | null;
  status?: 'open' | 'in_progress' | 'completed' | 'cancelled';
  assignee?: string | null;
}

export interface SavedEntry {
  id: string;
  title: string;
  fields: FieldRecord;
  fieldDefinitions?: FieldDefinition[];
  category?: string;
  // Agentic enrichment fields (populated by processEntryDeep)
  tags?: string[];
  action_items?: ActionItem[];
  entities?: string[];
  linked_entries?: string[];
  summary?: string;
  processed?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Voice processing result types
export interface VoiceProcessingResult {
  success: boolean;
  action?: 'create' | 'update' | 'navigate' | 'search';
  data?: Partial<SavedEntry>;
  error?: string;
}

// Category type
export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  entryCount?: number;
}
