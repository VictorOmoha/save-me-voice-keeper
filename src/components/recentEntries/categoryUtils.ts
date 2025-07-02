
import { SavedEntry } from "@/types/dashboard";
import { FileText, Heart, Users, DollarSign, User } from "lucide-react";

export const getCategoryName = (entry: SavedEntry) => {
  // First check if the entry has a category field
  if (entry.fields?.category) {
    return entry.fields.category;
  }
  
  // Fallback to title-based categorization
  const titleLower = entry.title.toLowerCase();
  if (titleLower.includes('document') || titleLower.includes('paper')) return 'Documents';
  if (titleLower.includes('health') || titleLower.includes('medical')) return 'Health';
  if (titleLower.includes('contact') || titleLower.includes('people')) return 'Contacts';
  if (titleLower.includes('bank') || titleLower.includes('finance')) return 'Finance';
  return 'Personal';
};

export const getCategoryIcon = (entry: SavedEntry) => {
  const categoryName = getCategoryName(entry).toLowerCase();
  if (categoryName.includes('document')) return FileText;
  if (categoryName.includes('health') || categoryName.includes('medical')) return Heart;
  if (categoryName.includes('contact')) return Users;
  if (categoryName.includes('finance') || categoryName.includes('bank')) return DollarSign;
  return User;
};

export const getCategoryColor = (entry: SavedEntry) => {
  const categoryName = getCategoryName(entry).toLowerCase();
  if (categoryName.includes('document')) return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
  if (categoryName.includes('health') || categoryName.includes('medical')) return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
  if (categoryName.includes('contact')) return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400';
  if (categoryName.includes('finance') || categoryName.includes('bank')) return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400';
  return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
};

export const getEntryType = (entry: SavedEntry): string => {
  const fieldCount = Object.keys(entry.fields).length;
  if (fieldCount <= 2) return 'Simple';
  if (fieldCount <= 5) return 'Form';
  return 'Complex';
};
