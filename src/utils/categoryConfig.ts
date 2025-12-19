import {
  FileText,
  Heart,
  Users,
  DollarSign,
  User,
  Calendar,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Briefcase,
  Shield,
  Pill,
  FileCheck,
  Tag,
  LucideIcon,
} from "lucide-react";

export interface CategoryConfig {
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  gradientFrom?: string;
  gradientTo?: string;
  priorityFields: string[];
  fieldIcons: Record<string, LucideIcon>;
}

export const categoryConfig: Record<string, CategoryConfig> = {
  Documents: {
    icon: FileText,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
    gradientFrom: "from-blue-500",
    gradientTo: "to-blue-600",
    priorityFields: ["documentType", "description", "expirationDate", "issuer"],
    fieldIcons: {
      documentType: FileCheck,
      expirationDate: Calendar,
      issuer: Briefcase,
    },
  },
  Health: {
    icon: Heart,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-200 dark:border-red-800",
    gradientFrom: "from-red-500",
    gradientTo: "to-rose-600",
    priorityFields: ["condition", "medication", "doctor", "hospital", "dosage", "nextAppointment"],
    fieldIcons: {
      medication: Pill,
      doctor: User,
      hospital: MapPin,
      nextAppointment: Calendar,
    },
  },
  Contacts: {
    icon: Users,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    borderColor: "border-green-200 dark:border-green-800",
    gradientFrom: "from-green-500",
    gradientTo: "to-emerald-600",
    priorityFields: ["name", "phone", "email", "company", "relationship", "address"],
    fieldIcons: {
      phone: Phone,
      email: Mail,
      company: Briefcase,
      address: MapPin,
    },
  },
  Finance: {
    icon: DollarSign,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    borderColor: "border-amber-200 dark:border-amber-800",
    gradientFrom: "from-amber-500",
    gradientTo: "to-orange-600",
    priorityFields: ["accountType", "accountNumber", "bank", "balance", "cardNumber"],
    fieldIcons: {
      accountNumber: CreditCard,
      bank: Briefcase,
      cardNumber: CreditCard,
    },
  },
  Personal: {
    icon: User,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    borderColor: "border-purple-200 dark:border-purple-800",
    gradientFrom: "from-purple-500",
    gradientTo: "to-violet-600",
    priorityFields: ["notes", "description", "date", "reminder"],
    fieldIcons: {
      date: Calendar,
    },
  },
  Insurance: {
    icon: Shield,
    color: "text-teal-600 dark:text-teal-400",
    bgColor: "bg-teal-50 dark:bg-teal-950/30",
    borderColor: "border-teal-200 dark:border-teal-800",
    gradientFrom: "from-teal-500",
    gradientTo: "to-cyan-600",
    priorityFields: ["policyNumber", "provider", "coverage", "premium", "expirationDate"],
    fieldIcons: {
      policyNumber: FileCheck,
      provider: Briefcase,
      expirationDate: Calendar,
    },
  },
};

export const defaultCategoryConfig: CategoryConfig = {
  icon: Tag,
  color: "text-gray-600 dark:text-gray-400",
  bgColor: "bg-gray-50 dark:bg-gray-950/30",
  borderColor: "border-gray-200 dark:border-gray-800",
  gradientFrom: "from-gray-500",
  gradientTo: "to-gray-600",
  priorityFields: [],
  fieldIcons: {},
};

export const getCategoryConfig = (category: string): CategoryConfig => {
  return categoryConfig[category] || defaultCategoryConfig;
};

// Print-specific category colors
export const categoryPrintColors: Record<string, { primary: string; secondary: string; accent: string }> = {
  Documents: { primary: "#2563eb", secondary: "#dbeafe", accent: "#1d4ed8" },
  Health: { primary: "#dc2626", secondary: "#fee2e2", accent: "#b91c1c" },
  Contacts: { primary: "#16a34a", secondary: "#dcfce7", accent: "#15803d" },
  Finance: { primary: "#d97706", secondary: "#fef3c7", accent: "#b45309" },
  Personal: { primary: "#9333ea", secondary: "#f3e8ff", accent: "#7c3aed" },
  Insurance: { primary: "#0891b2", secondary: "#cffafe", accent: "#0e7490" },
};

export const defaultPrintColors = { primary: "#6b7280", secondary: "#f3f4f6", accent: "#4b5563" };
