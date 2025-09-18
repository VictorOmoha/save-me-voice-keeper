import { SavedEntry } from "@/types/dashboard";
import { TableData } from "@/components/forms/types";
import { createComprehensiveBooksEntry, sampleBooks } from "./bookStructureTemplate";

/**
 * Restructures an existing Books entry to use the comprehensive table format
 */
export const restructureBooksEntry = (existingEntry: SavedEntry): Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'> => {
  const comprehensiveEntry = createComprehensiveBooksEntry();
  
  // Extract existing book data from the old structure
  const existingBooks: any[] = [];
  
  // Check for existing name/author table structure
  if (existingEntry.fields.name?.rows) {
    const nameRows = existingEntry.fields.name.rows;
    const authorRows = existingEntry.fields.author?.rows || [];
    
    // Combine name and author data
    nameRows.forEach((nameRow: any, index: number) => {
      const authorRow = authorRows[index];
      existingBooks.push({
        title: nameRow.item || nameRow.name || "Unknown Title",
        author: authorRow?.item || authorRow?.name || "Unknown Author",
        genre: "Unknown",
        year_published: null,
        isbn: "",
        status: "To Read",
        rating: null,
        date_started: null,
        date_finished: null,
        pages: null,
        format: "Physical Book",
        owned: true,
        location: "Home Library",
        recommended_by: "",
        notes: "",
        tags: "",
        series: "",
        book_number: null,
        purchase_price: null,
        language: "English"
      });
    });
  }
  
  // If no existing books found, keep the sample book
  if (existingBooks.length === 0) {
    existingBooks.push(comprehensiveEntry.fields.books_table.rows[0]);
  }
  
  // Add sample books to demonstrate the full structure
  existingBooks.push(...sampleBooks);
  
  // Update the comprehensive entry with migrated + sample data
  const updatedTableData: TableData = {
    ...comprehensiveEntry.fields.books_table,
    rows: existingBooks
  };
  
  return {
    ...comprehensiveEntry,
    title: existingEntry.title + " (Restructured)",
    fields: {
      ...comprehensiveEntry.fields,
      books_table: updatedTableData
    }
  };
};

/**
 * Creates status options for books
 */
export const bookStatusOptions = [
  "To Read",
  "Reading", 
  "Finished",
  "DNF (Did Not Finish)",
  "Reference"
];

/**
 * Creates format options for books
 */
export const bookFormatOptions = [
  "Physical Book",
  "Ebook",
  "Audiobook",
  "PDF",
  "Magazine",
  "Online Article"
];

/**
 * Creates common genre options
 */
export const bookGenreOptions = [
  "Fiction",
  "Non-Fiction", 
  "Biography",
  "History",
  "Science",
  "Technology",
  "Business",
  "Self-Help",
  "Philosophy",
  "Religious/Spiritual",
  "Fantasy",
  "Science Fiction",
  "Mystery/Thriller",
  "Romance",
  "Horror",
  "Young Adult",
  "Children's",
  "Poetry",
  "Drama",
  "Reference"
];
