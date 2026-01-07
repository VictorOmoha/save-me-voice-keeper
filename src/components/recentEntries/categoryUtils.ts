
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
  if (categoryName.includes('document')) return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
  if (categoryName.includes('health') || categoryName.includes('medical')) return 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20';
  if (categoryName.includes('contact')) return 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20';
  if (categoryName.includes('finance') || categoryName.includes('bank')) return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20';
  return 'bg-primary/10 text-primary border border-primary/20';
};

export const getEntryType = (entry: SavedEntry): string => {
  const fieldCount = Object.keys(entry.fields).length;
  if (fieldCount <= 2) return 'Simple';
  if (fieldCount <= 5) return 'Form';
  return 'Complex';
};
