
import { SavedEntry } from "@/types/dashboard";

export const useCategoryFilter = () => {
  const filterEntriesByCategory = (entries: SavedEntry[], categoryName: string) => {
    return entries.filter(entry => {
      console.log(`DIAGNOSTIC: Checking entry "${entry.title}" for category "${categoryName}":`, {
        entryCategory: entry.fields.category,
        documentType: entry.fields.documentType,
        fileName: entry.fields.fileName,
        hasUploadedFile: entry.fields.hasUploadedFile,
        titleLowerCase: entry.title.toLowerCase()
      });

      if (categoryName === "Documents") {
        // More comprehensive criteria for Documents
        const isDocument = (
          entry.fields.category?.toLowerCase() === "documents" ||
          entry.fields.category?.toLowerCase() === "document" ||
          entry.fields.documentType ||
          entry.fields.fileName ||
          entry.fields.hasUploadedFile ||
          entry.title.toLowerCase().includes("document") ||
          entry.title.toLowerCase().includes("doc") ||
          entry.title.toLowerCase().includes("pdf") ||
          entry.title.toLowerCase().includes("word")
        );
        
        console.log(`DIAGNOSTIC: Entry "${entry.title}" document check result:`, isDocument);
        return isDocument;
      }
      
      // For other categories, use existing logic
      const isMatch = (
        entry.fields.category?.toLowerCase() === categoryName.toLowerCase() ||
        (categoryName === "Health" && entry.title.toLowerCase().includes("health")) ||
        (categoryName === "Contacts" && entry.title.toLowerCase().includes("contact")) ||
        (categoryName === "Finance" && entry.title.toLowerCase().includes("finance")) ||
        (categoryName === "Personal" && entry.title.toLowerCase().includes("personal"))
      );
      
      console.log(`DIAGNOSTIC: Entry "${entry.title}" category match result:`, isMatch);
      return isMatch;
    });
  };

  return { filterEntriesByCategory };
};
