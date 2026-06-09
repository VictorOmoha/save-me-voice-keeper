
import { SavedEntry } from "@/types/dashboard";

export const exportToCSV = (entries: SavedEntry[], filename: string = 'form-data') => {
  if (entries.length === 0) {
    throw new Error('No data to export');
  }

  // Get all unique field names across all entries
  const allFieldNames = new Set<string>();
  entries.forEach(entry => {
    Object.keys(entry.fields).forEach(field => {
      allFieldNames.add(field);
    });
  });

  // Create header row with entry metadata and all fields
  const headers = [
    'Entry ID',
    'Title',
    'Created Date',
    'Last Modified',
    ...Array.from(allFieldNames).sort()
  ];

  // Create data rows
  const rows = entries.map(entry => {
    const row: string[] = [
      entry.id,
      entry.title,
      new Date(entry.createdAt).toLocaleDateString(),
      new Date(entry.updatedAt).toLocaleDateString()
    ];

    // Add field values in the same order as headers
    Array.from(allFieldNames).sort().forEach(fieldName => {
      const value = entry.fields[fieldName];
      // Handle different data types and escape CSV special characters
      if (value === null || value === undefined) {
        row.push('');
      } else if (typeof value === 'boolean') {
        row.push(value ? 'Yes' : 'No');
      } else if (typeof value === 'number') {
        row.push(value.toString());
      } else {
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          row.push(`"${stringValue.replace(/"/g, '""')}"`);
        } else {
          row.push(stringValue);
        }
      }
    });

    return row;
  });

  // Create CSV content
  const csvContent = [headers, ...rows]
    .map(row => row.join(','))
    .join('\n');

  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const exportCategoryToCSV = (entries: SavedEntry[], categoryName: string) => {
  const categoryEntries = entries.filter(entry => {
    const category = entry.fields.category;
    return typeof category === 'string' && category.toLowerCase() === categoryName.toLowerCase();
  });
  
  if (categoryEntries.length === 0) {
    throw new Error(`No entries found for category: ${categoryName}`);
  }
  
  exportToCSV(categoryEntries, `${categoryName.toLowerCase()}-data`);
};
