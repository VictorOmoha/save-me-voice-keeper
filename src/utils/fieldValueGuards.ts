/**
 * Type guards and narrowing helpers for the FieldValue union.
 * Use these instead of casting when rendering or processing entry fields.
 */

import type {
  FieldValue,
  TableFieldValue,
  ImageFieldValue,
  GalleryFieldValue,
} from "@/types/dashboard";

export const isTableFieldValue = (value: unknown): value is TableFieldValue => {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Array.isArray((value as TableFieldValue).headers) &&
    Array.isArray((value as TableFieldValue).rows)
  );
};

export const isImageFieldValue = (value: unknown): value is ImageFieldValue => {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as ImageFieldValue).url === "string"
  );
};

export const isGalleryFieldValue = (value: unknown): value is GalleryFieldValue => {
  return Array.isArray(value) && value.every(isImageFieldValue);
};

/** True for values that can be used directly as strings (keys, search, etc.) */
export const isPrimitiveFieldValue = (
  value: FieldValue | unknown
): value is string | number | boolean => {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
};

/**
 * Convert any FieldValue into a human-readable string.
 * Safe for rendering as a ReactNode and for search/filter comparisons.
 */
export const fieldValueToText = (value: FieldValue | unknown): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value instanceof Date) return value.toLocaleDateString();
  if (isTableFieldValue(value)) return `[Table: ${value.rows.length} rows]`;
  if (isImageFieldValue(value)) return value.name || value.url;
  if (isGalleryFieldValue(value)) return `[Gallery: ${value.length} images]`;
  if (Array.isArray(value)) return value.map((v) => fieldValueToText(v)).join(", ");
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};
