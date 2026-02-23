/**
 * Shared field formatting utilities for consistent display across the app
 */

/**
 * Format a field value for display based on the field key
 */
export const formatFieldValue = (key: string, value: unknown): string => {
  if (value === null || value === undefined || value === "") return "—";

  const keyLower = key.toLowerCase();

  // Handle file size
  if (keyLower.includes("size") && typeof value === "number") {
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }

  // Handle dates
  if (keyLower.includes("date") || keyLower.includes("expir")) {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  }

  // Handle phone numbers
  if (keyLower.includes("phone") || keyLower.includes("mobile") || keyLower.includes("tel")) {
    const cleaned = String(value).replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    if (cleaned.length === 11 && cleaned.startsWith("1")) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
  }

  // Handle currency
  if (
    keyLower.includes("balance") ||
    keyLower.includes("amount") ||
    keyLower.includes("price") ||
    keyLower.includes("cost") ||
    keyLower.includes("premium")
  ) {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(num);
    }
  }

  // Handle card/account numbers (mask them for security)
  if (keyLower.includes("cardnumber") || keyLower.includes("accountnumber")) {
    const str = String(value);
    if (str.length >= 4) {
      return `****${str.slice(-4)}`;
    }
  }

  // Handle SSN (mask)
  if (keyLower.includes("ssn") || keyLower.includes("socialsecurity")) {
    const str = String(value).replace(/\D/g, "");
    if (str.length >= 4) {
      return `***-**-${str.slice(-4)}`;
    }
  }

  // Handle booleans
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  // Handle objects (table data, etc.)
  if (typeof value === "object" && value !== null) {
    if ("columns" in value && "rows" in value) {
      return `[Table: ${value.rows?.length || 0} rows]`;
    }
    return JSON.stringify(value);
  }

  // Truncate long text
  const strValue = String(value);
  if (strValue.length > 150) {
    return strValue.slice(0, 150) + "...";
  }

  return strValue;
};

/**
 * Format a field key for display (camelCase -> Title Case)
 */
export const formatFieldName = (key: string): string => {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

/**
 * Format a date for full display
 */
export const formatFullDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/**
 * Format a date for short display
 */
export const formatShortDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

/**
 * Fields that should be hidden from display
 */
export const metadataFields = [
  "category",
  "hasUploadedFile",
  "fileName",
  "fileSize",
  "fileType",
  "documentType",
  "storagePath",
  "documentContent",
  "documentNotesHtml",
  "updatedAt",
];

/**
 * Check if a field should be displayed
 */
export const shouldDisplayField = (key: string, value: unknown): boolean => {
  if (metadataFields.includes(key)) return false;
  if (value === null || value === undefined || value === "") return false;
  return true;
};
