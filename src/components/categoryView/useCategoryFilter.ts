
import { SavedEntry } from "@/types/dashboard";

export const useCategoryFilter = () => {
  const filterEntriesByCategory = (entries: SavedEntry[], categoryName: string) => {
    return entries.filter(entry => {
      const entryCategory = typeof entry.fields.category === "string"
        ? entry.fields.category.toLowerCase()
        : undefined;
      if (categoryName === "Documents") {
        // More comprehensive criteria for Documents
        const isDocument = (
          entryCategory === "documents" ||
          entryCategory === "document" ||
          entry.fields.documentType ||
          entry.fields.fileName ||
          entry.fields.hasUploadedFile ||
          entry.title.toLowerCase().includes("document") ||
          entry.title.toLowerCase().includes("doc") ||
          entry.title.toLowerCase().includes("pdf") ||
          entry.title.toLowerCase().includes("word")
        );
        
        return isDocument;
      }
      
      // For other categories, use existing logic
      const isMatch = (
        entryCategory === categoryName.toLowerCase() ||
        (categoryName === "Health" && entry.title.toLowerCase().includes("health")) ||
        (categoryName === "Contacts" && entry.title.toLowerCase().includes("contact")) ||
        (categoryName === "Finance" && entry.title.toLowerCase().includes("finance")) ||
        (categoryName === "Personal" && entry.title.toLowerCase().includes("personal"))
      );
      
      return isMatch;
    });
  };

  return { filterEntriesByCategory };
};
