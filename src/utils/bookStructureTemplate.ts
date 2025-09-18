import { SavedEntry } from "@/types/dashboard";
import { TableData } from "@/components/forms/types";

/**
 * Comprehensive Books Database Template
 * Provides a structured approach to managing book collections with detailed metadata
 */
export const createComprehensiveBooksEntry = (): Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'> => {
  const booksTableData: TableData = {
    columns: [
      { id: "title", name: "Title", type: "text", required: true },
      { id: "author", name: "Author", type: "text", required: true },
      { id: "genre", name: "Genre", type: "text" },
      { id: "year_published", name: "Year Published", type: "number" },
      { id: "isbn", name: "ISBN", type: "text" },
      { id: "status", name: "Status", type: "text" }, // To Read, Reading, Finished, DNF
      { id: "rating", name: "Rating (1-5)", type: "number" },
      { id: "date_started", name: "Date Started", type: "date" },
      { id: "date_finished", name: "Date Finished", type: "date" },
      { id: "pages", name: "Pages", type: "number" },
      { id: "format", name: "Format", type: "text" }, // Physical, Ebook, Audiobook, PDF
      { id: "owned", name: "Owned", type: "checkbox" },
      { id: "location", name: "Location", type: "text" }, // Home Library, Kindle, Audible, etc.
      { id: "recommended_by", name: "Recommended By", type: "text" },
      { id: "notes", name: "Notes", type: "text" },
      { id: "tags", name: "Tags", type: "text" }, // Comma-separated values
      { id: "series", name: "Series", type: "text" },
      { id: "book_number", name: "Book #", type: "number" },
      { id: "purchase_price", name: "Purchase Price", type: "number" },
      { id: "language", name: "Language", type: "text" }
    ],
    rows: [
      {
        title: "The Believers Authority",
        author: "Andrew Wommack",
        genre: "Religious/Spiritual",
        year_published: 2007,
        isbn: "978-1577949230",
        status: "To Read",
        rating: null,
        date_started: null,
        date_finished: null,
        pages: 144,
        format: "Physical Book",
        owned: true,
        location: "Home Library",
        recommended_by: "",
        notes: "Explores the believer's authority in Christ and spiritual warfare",
        tags: "Spiritual, Authority, Faith, Christianity",
        series: "",
        book_number: null,
        purchase_price: null,
        language: "English"
      }
    ]
  };

  return {
    title: "Books Database",
    category: "Personal",
    fields: {
      category: "Personal",
      books_table: booksTableData
    },
    fieldDefinitions: [
      { id: "category", name: "Category", type: "text" },
      { id: "books_table", name: "Books Collection", type: "table" }
    ]
  };
};

/**
 * Sample book entries for demonstration
 */
export const sampleBooks = [
  {
    title: "Atomic Habits",
    author: "James Clear",
    genre: "Self-Help",
    year_published: 2018,
    isbn: "978-0735211292",
    status: "Finished",
    rating: 5,
    date_started: "2024-01-15",
    date_finished: "2024-02-01",
    pages: 320,
    format: "Ebook",
    owned: true,
    location: "Kindle",
    recommended_by: "Friend",
    notes: "Excellent framework for building good habits and breaking bad ones",
    tags: "Habits, Productivity, Self-Improvement",
    series: "",
    book_number: null,
    purchase_price: 12.99,
    language: "English"
  },
  {
    title: "The Fellowship of the Ring",
    author: "J.R.R. Tolkien",
    genre: "Fantasy",
    year_published: 1954,
    isbn: "978-0547928210",
    status: "Reading",
    rating: null,
    date_started: "2024-03-01",
    date_finished: null,
    pages: 479,
    format: "Physical Book",
    owned: true,
    location: "Home Library",
    recommended_by: "Classic Literature List",
    notes: "Epic fantasy adventure, part of Lord of the Rings trilogy",
    tags: "Fantasy, Adventure, Classic, Middle-earth",
    series: "The Lord of the Rings",
    book_number: 1,
    purchase_price: 15.99,
    language: "English"
  }
];