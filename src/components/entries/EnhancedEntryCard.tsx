import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SavedEntry } from "@/types/dashboard";
import {
  FileText,
  Heart,
  Users,
  DollarSign,
  User,
  Calendar,
  Clock,
  Edit,
  Trash2,
  Copy,
  Download,
  Eye,
  MoreHorizontal,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Briefcase,
  Shield,
  Pill,
  FileCheck,
  Tag
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface EnhancedEntryCardProps {
  entry: SavedEntry;
  onView?: (entry: SavedEntry) => void;
  onEdit?: (entry: SavedEntry) => void;
  onDelete?: (id: string) => void;
  onFill?: (entry: SavedEntry) => void;
  onDownload?: (entry: SavedEntry) => void;
  variant?: "grid" | "list" | "compact";
  className?: string;
}

// Category configuration with colors, icons, and field priorities
const categoryConfig: Record<string, {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  priorityFields: string[];
  fieldIcons: Record<string, React.ElementType>;
}> = {
  Documents: {
    icon: FileText,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
    priorityFields: ["documentType", "description", "expirationDate", "issuer"],
    fieldIcons: {
      documentType: FileCheck,
      expirationDate: Calendar,
      issuer: Briefcase,
    }
  },
  Health: {
    icon: Heart,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50 dark:bg-red-950/30",
    borderColor: "border-red-200 dark:border-red-800",
    priorityFields: ["condition", "medication", "doctor", "hospital", "dosage", "nextAppointment"],
    fieldIcons: {
      medication: Pill,
      doctor: User,
      hospital: MapPin,
      nextAppointment: Calendar,
    }
  },
  Contacts: {
    icon: Users,
    color: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    borderColor: "border-green-200 dark:border-green-800",
    priorityFields: ["name", "phone", "email", "company", "relationship", "address"],
    fieldIcons: {
      phone: Phone,
      email: Mail,
      company: Briefcase,
      address: MapPin,
    }
  },
  Finance: {
    icon: DollarSign,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    borderColor: "border-amber-200 dark:border-amber-800",
    priorityFields: ["accountType", "accountNumber", "bank", "balance", "cardNumber"],
    fieldIcons: {
      accountNumber: CreditCard,
      bank: Briefcase,
      cardNumber: CreditCard,
    }
  },
  Personal: {
    icon: User,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    borderColor: "border-purple-200 dark:border-purple-800",
    priorityFields: ["notes", "description", "date", "reminder"],
    fieldIcons: {
      date: Calendar,
      reminder: Clock,
    }
  },
  Insurance: {
    icon: Shield,
    color: "text-teal-600 dark:text-teal-400",
    bgColor: "bg-teal-50 dark:bg-teal-950/30",
    borderColor: "border-teal-200 dark:border-teal-800",
    priorityFields: ["policyNumber", "provider", "coverage", "premium", "expirationDate"],
    fieldIcons: {
      policyNumber: FileCheck,
      provider: Briefcase,
      expirationDate: Calendar,
    }
  },
};

const defaultConfig = {
  icon: Tag,
  color: "text-gray-600 dark:text-gray-400",
  bgColor: "bg-gray-50 dark:bg-gray-950/30",
  borderColor: "border-gray-200 dark:border-gray-800",
  priorityFields: [],
  fieldIcons: {}
};

// Format field value for display
const formatFieldValue = (key: string, value: any): string => {
  if (value === null || value === undefined || value === "") return "";

  // Handle file size
  if (key.toLowerCase().includes("size") && typeof value === "number") {
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }

  // Handle dates
  if (key.toLowerCase().includes("date") || key.toLowerCase().includes("expir")) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
      });
    }
  }

  // Handle phone numbers
  if (key.toLowerCase().includes("phone") || key.toLowerCase().includes("mobile")) {
    const cleaned = String(value).replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
  }

  // Handle currency
  if (key.toLowerCase().includes("balance") || key.toLowerCase().includes("amount") || key.toLowerCase().includes("price")) {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num);
    }
  }

  // Handle card/account numbers (mask them)
  if (key.toLowerCase().includes("cardnumber") || key.toLowerCase().includes("accountnumber")) {
    const str = String(value);
    if (str.length >= 4) {
      return `****${str.slice(-4)}`;
    }
  }

  // Truncate long text
  const strValue = String(value);
  if (strValue.length > 100) {
    return strValue.slice(0, 100) + "...";
  }

  return strValue;
};

// Format field name for display
const formatFieldName = (key: string): string => {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, str => str.toUpperCase())
    .replace(/_/g, " ")
    .trim();
};

export const EnhancedEntryCard: React.FC<EnhancedEntryCardProps> = ({
  entry,
  onView,
  onEdit,
  onDelete,
  onFill,
  onDownload,
  variant = "grid",
  className,
}) => {
  const category = entry.fields.category as string || "Personal";
  const config = categoryConfig[category] || defaultConfig;
  const CategoryIcon = config.icon;

  // Filter out metadata fields
  const metadataFields = ["category", "hasUploadedFile", "fileName", "fileSize", "fileType", "documentType"];
  const displayFields = Object.entries(entry.fields)
    .filter(([key]) => !metadataFields.includes(key))
    .filter(([_, value]) => value !== null && value !== undefined && value !== "");

  // Sort fields by priority
  const sortedFields = displayFields.sort(([keyA], [keyB]) => {
    const priorityA = config.priorityFields.indexOf(keyA);
    const priorityB = config.priorityFields.indexOf(keyB);
    if (priorityA === -1 && priorityB === -1) return 0;
    if (priorityA === -1) return 1;
    if (priorityB === -1) return -1;
    return priorityA - priorityB;
  });

  // Get preview fields (first 3-4 based on variant)
  const maxPreviewFields = variant === "compact" ? 2 : variant === "list" ? 3 : 4;
  const previewFields = sortedFields.slice(0, maxPreviewFields);
  const remainingCount = sortedFields.length - maxPreviewFields;

  const hasFile = entry.fields.hasUploadedFile && entry.fields.fileName;

  const createdDate = new Date(entry.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg border transition-all duration-200",
          "hover:shadow-md hover:border-primary/30 cursor-pointer",
          config.borderColor,
          className
        )}
        onClick={() => onView?.(entry)}
      >
        <div className={cn("p-2 rounded-lg", config.bgColor)}>
          <CategoryIcon className={cn("w-4 h-4", config.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{entry.title}</h4>
          <p className="text-xs text-muted-foreground truncate">
            {previewFields.map(([k, v]) => formatFieldValue(k, v)).filter(Boolean).join(" • ")}
          </p>
        </div>
        <Badge variant="outline" className="text-xs shrink-0">
          {createdDate}
        </Badge>
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div
        className={cn(
          "flex items-start gap-4 p-4 rounded-xl border transition-all duration-200",
          "hover:shadow-lg hover:border-primary/30",
          config.borderColor,
          className
        )}
      >
        <div className={cn("p-3 rounded-xl shrink-0", config.bgColor)}>
          <CategoryIcon className={cn("w-6 h-6", config.color)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-lg">{entry.title}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className={cn("text-xs", config.color, config.bgColor)}>
                  {category}
                </Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {createdDate}
                </span>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onView && (
                  <DropdownMenuItem onClick={() => onView(entry)}>
                    <Eye className="w-4 h-4 mr-2" /> View Details
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(entry)}>
                    <Edit className="w-4 h-4 mr-2" /> Edit
                  </DropdownMenuItem>
                )}
                {onFill && (
                  <DropdownMenuItem onClick={() => onFill(entry)}>
                    <Copy className="w-4 h-4 mr-2" /> Use as Template
                  </DropdownMenuItem>
                )}
                {hasFile && onDownload && (
                  <DropdownMenuItem onClick={() => onDownload(entry)}>
                    <Download className="w-4 h-4 mr-2" /> Download File
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(entry.id)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            {previewFields.map(([key, value]) => {
              const FieldIcon = config.fieldIcons[key] || Tag;
              const formattedValue = formatFieldValue(key, value);
              if (!formattedValue) return null;

              return (
                <div key={key} className="flex items-center gap-2 text-sm">
                  <FieldIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">{formatFieldName(key)}:</span>
                  <span className="font-medium truncate">{formattedValue}</span>
                </div>
              );
            })}
          </div>

          {remainingCount > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              +{remainingCount} more field{remainingCount > 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Grid variant (default)
  return (
    <Card
      className={cn(
        "group overflow-hidden transition-all duration-300",
        "hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1",
        "border-2",
        config.borderColor,
        className
      )}
    >
      {/* Header with gradient */}
      <div className={cn("px-4 py-3 border-b", config.bgColor, config.borderColor)}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2.5 rounded-xl bg-background shadow-sm",
              "ring-2 ring-offset-1",
              config.borderColor
            )}>
              <CategoryIcon className={cn("w-5 h-5", config.color)} />
            </div>
            <div>
              <h3 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
                {entry.title}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge
                  variant="secondary"
                  className={cn("text-xs px-2 py-0", config.color, "bg-background")}
                >
                  {category}
                </Badge>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {onView && (
                <DropdownMenuItem onClick={() => onView(entry)}>
                  <Eye className="w-4 h-4 mr-2" /> View Details
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(entry)}>
                  <Edit className="w-4 h-4 mr-2" /> Edit Entry
                </DropdownMenuItem>
              )}
              {onFill && (
                <DropdownMenuItem onClick={() => onFill(entry)}>
                  <Copy className="w-4 h-4 mr-2" /> Use as Template
                </DropdownMenuItem>
              )}
              {hasFile && onDownload && (
                <DropdownMenuItem onClick={() => onDownload(entry)}>
                  <Download className="w-4 h-4 mr-2" /> Download File
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDelete(entry.id)}
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Fields */}
        <div className="space-y-2.5">
          {previewFields.map(([key, value]) => {
            const FieldIcon = config.fieldIcons[key] || Tag;
            const formattedValue = formatFieldValue(key, value);
            if (!formattedValue) return null;

            return (
              <div
                key={key}
                className="flex items-start gap-2 text-sm"
              >
                <FieldIcon className={cn("w-4 h-4 mt-0.5 shrink-0", config.color)} />
                <div className="min-w-0 flex-1">
                  <span className="text-muted-foreground text-xs uppercase tracking-wide">
                    {formatFieldName(key)}
                  </span>
                  <p className="font-medium text-foreground line-clamp-2">
                    {formattedValue}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {remainingCount > 0 && (
          <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
            +{remainingCount} more field{remainingCount > 1 ? "s" : ""}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{createdDate}</span>
          </div>

          {hasFile && (
            <Badge variant="outline" className="text-xs gap-1">
              <FileText className="w-3 h-3" />
              {entry.fields.fileName}
            </Badge>
          )}
        </div>

        {/* Quick Actions on Hover */}
        <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
          {onView && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8"
              onClick={() => onView(entry)}
            >
              <Eye className="w-3.5 h-3.5 mr-1" />
              View
            </Button>
          )}
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-8"
              onClick={() => onEdit(entry)}
            >
              <Edit className="w-3.5 h-3.5 mr-1" />
              Edit
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedEntryCard;
