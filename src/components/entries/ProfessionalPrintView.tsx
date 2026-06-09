/* eslint-disable react-refresh/only-export-components */
import React from "react";
import { SavedEntry } from "@/types/dashboard";
import { TableData } from "@/components/forms/types";

interface ProfessionalPrintViewProps {
  entries: SavedEntry[];
  title?: string;
  includeMetadata?: boolean;
  pageBreaks?: boolean;
}

// Category colors for print
const categoryColors: Record<string, { primary: string; secondary: string; accent: string }> = {
  Documents: { primary: "#2563eb", secondary: "#dbeafe", accent: "#1d4ed8" },
  Health: { primary: "#dc2626", secondary: "#fee2e2", accent: "#b91c1c" },
  Contacts: { primary: "#16a34a", secondary: "#dcfce7", accent: "#15803d" },
  Finance: { primary: "#d97706", secondary: "#fef3c7", accent: "#b45309" },
  Personal: { primary: "#9333ea", secondary: "#f3e8ff", accent: "#7c3aed" },
  Insurance: { primary: "#0891b2", secondary: "#cffafe", accent: "#0e7490" },
};

const defaultColors = { primary: "#6b7280", secondary: "#f3f4f6", accent: "#4b5563" };

const isTableDataValue = (value: unknown): value is TableData =>
  typeof value === "object" && value !== null && "columns" in value;

// Format field value for print
const formatFieldValue = (key: string, value: unknown): string => {
  if (value === null || value === undefined || value === "") return "—";

  if (key.toLowerCase().includes("size") && typeof value === "number") {
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (key.toLowerCase().includes("date") || key.toLowerCase().includes("expir")) {
    if (typeof value === "string" || typeof value === "number" || value instanceof Date) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric"
        });
      }
    }
  }

  if (key.toLowerCase().includes("phone") || key.toLowerCase().includes("mobile")) {
    const cleaned = String(value).replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
  }

  if (key.toLowerCase().includes("balance") || key.toLowerCase().includes("amount") ||
      key.toLowerCase().includes("price") || key.toLowerCase().includes("cost")) {
    const num = parseFloat(String(value));
    if (!isNaN(num)) {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num);
    }
  }

  if (key.toLowerCase().includes("cardnumber") || key.toLowerCase().includes("accountnumber")) {
    const str = String(value);
    if (str.length >= 4) {
      return `****${str.slice(-4)}`;
    }
  }

  return String(value);
};

const formatFieldName = (key: string): string => {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, str => str.toUpperCase())
    .replace(/_/g, " ")
    .trim();
};

// Render table data for print
const renderTableForPrint = (tableData: TableData): string => {
  if (!tableData.columns || tableData.columns.length === 0) {
    return '<p class="no-data">No table data</p>';
  }

  return `
    <table class="print-table">
      <thead>
        <tr>
          ${tableData.columns.map(col => `<th>${col.name}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${tableData.rows.map(row => `
          <tr>
            ${tableData.columns.map(col => {
              const val = row[col.id];
              let displayVal = val;
              if (col.type === "checkbox") displayVal = val ? "✓" : "—";
              else if (col.type === "date" && val && (typeof val === "string" || typeof val === "number" || val instanceof Date)) {
                const d = new Date(val);
                displayVal = !isNaN(d.getTime()) ? d.toLocaleDateString() : val;
              }
              else if (val === null || val === undefined) displayVal = "—";
              return `<td>${displayVal}</td>`;
            }).join("")}
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
};

export const generateProfessionalPrintHTML = (
  entries: SavedEntry[],
  options: {
    title?: string;
    includeMetadata?: boolean;
    pageBreaks?: boolean;
  } = {}
): string => {
  const { title = "SaveMe Data Export", includeMetadata = true, pageBreaks = false } = options;

  const styles = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        color: #1f2937;
        line-height: 1.5;
        background: white;
      }

      .print-container {
        max-width: 8.5in;
        margin: 0 auto;
        padding: 0.5in;
      }

      /* Header */
      .print-header {
        text-align: center;
        margin-bottom: 32px;
        padding-bottom: 24px;
        border-bottom: 3px solid #1f2937;
      }

      .print-logo {
        font-size: 32px;
        font-weight: 800;
        color: #1f2937;
        margin-bottom: 8px;
        letter-spacing: -0.5px;
      }

      .print-logo span {
        color: #6366f1;
      }

      .print-title {
        font-size: 14px;
        color: #6b7280;
        margin-bottom: 4px;
      }

      .print-date {
        font-size: 12px;
        color: #9ca3af;
      }

      .print-summary {
        display: flex;
        justify-content: center;
        gap: 24px;
        margin-top: 16px;
        padding: 12px 24px;
        background: #f9fafb;
        border-radius: 8px;
        font-size: 13px;
      }

      .summary-item {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .summary-count {
        font-weight: 700;
        color: #1f2937;
      }

      /* Entry Card */
      .entry-card {
        margin-bottom: 24px;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        overflow: hidden;
        break-inside: avoid;
      }

      .entry-header {
        padding: 16px 20px;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .entry-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        flex-shrink: 0;
      }

      .entry-title-section {
        flex: 1;
      }

      .entry-title {
        font-size: 18px;
        font-weight: 700;
        color: white;
        margin-bottom: 4px;
      }

      .entry-category {
        display: inline-block;
        padding: 2px 10px;
        background: rgba(255,255,255,0.2);
        border-radius: 12px;
        font-size: 11px;
        font-weight: 500;
        color: white;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      /* Entry Metadata */
      .entry-metadata {
        padding: 12px 20px;
        background: #f9fafb;
        border-bottom: 1px solid #e5e7eb;
        display: flex;
        gap: 24px;
        font-size: 12px;
        color: #6b7280;
      }

      .metadata-item {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .metadata-label {
        font-weight: 500;
      }

      /* Entry Content */
      .entry-content {
        padding: 20px;
      }

      .fields-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
      }

      .field-item {
        padding: 12px 16px;
        background: #f9fafb;
        border-radius: 8px;
        border-left: 3px solid;
      }

      .field-item.full-width {
        grid-column: span 2;
      }

      .field-label {
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #6b7280;
        margin-bottom: 4px;
      }

      .field-value {
        font-size: 14px;
        color: #1f2937;
        word-break: break-word;
      }

      .field-value.currency {
        font-size: 16px;
        font-weight: 600;
        color: #059669;
      }

      .field-value.masked {
        font-family: 'Courier New', monospace;
        letter-spacing: 2px;
      }

      .field-value.long-text {
        white-space: pre-wrap;
        line-height: 1.6;
      }

      /* Tables */
      .table-section {
        margin-top: 16px;
        grid-column: span 2;
      }

      .table-title {
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #374151;
        margin-bottom: 8px;
        padding-bottom: 8px;
        border-bottom: 1px solid #e5e7eb;
      }

      .print-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
      }

      .print-table th {
        background: #f3f4f6;
        padding: 10px 12px;
        text-align: left;
        font-weight: 600;
        color: #374151;
        border: 1px solid #e5e7eb;
      }

      .print-table td {
        padding: 8px 12px;
        border: 1px solid #e5e7eb;
        vertical-align: top;
      }

      .print-table tr:nth-child(even) {
        background: #f9fafb;
      }

      .no-data {
        color: #9ca3af;
        font-style: italic;
        text-align: center;
        padding: 16px;
      }

      /* Footer */
      .print-footer {
        margin-top: 32px;
        padding-top: 16px;
        border-top: 1px solid #e5e7eb;
        text-align: center;
        font-size: 11px;
        color: #9ca3af;
      }

      .print-footer a {
        color: #6366f1;
        text-decoration: none;
      }

      /* Page breaks */
      .page-break {
        page-break-before: always;
      }

      /* Print-specific styles */
      @media print {
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .print-container {
          padding: 0;
        }

        .entry-card {
          box-shadow: none;
        }

        .no-print {
          display: none !important;
        }
      }

      /* Screen preview styles */
      @media screen {
        .print-container {
          background: white;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          margin: 24px auto;
        }

        .print-button {
          position: fixed;
          top: 16px;
          right: 16px;
          padding: 12px 24px;
          background: #6366f1;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          z-index: 1000;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .print-button:hover {
          background: #4f46e5;
        }
      }
    </style>
  `;

  // Category icons (emoji for print compatibility)
  const categoryIcons: Record<string, string> = {
    Documents: "📄",
    Health: "❤️",
    Contacts: "👥",
    Finance: "💰",
    Personal: "👤",
    Insurance: "🛡️",
  };

  const entriesHTML = entries.map((entry, index) => {
    const category = entry.fields.category as string || "Personal";
    const colors = categoryColors[category] || defaultColors;
    const icon = categoryIcons[category] || "📋";

    const metadataFields = ["category", "hasUploadedFile", "fileName", "fileSize", "fileType"];
    const displayFields = Object.entries(entry.fields)
      .filter(([key]) => !metadataFields.includes(key))
      .filter(([_, value]) => value !== null && value !== undefined && value !== "");

    // Separate table fields from regular fields
    const regularFields = displayFields.filter(([_, value]) => !isTableDataValue(value));
    const tableFields = displayFields.filter(([_, value]) => isTableDataValue(value));

    const pageBreakClass = pageBreaks && index > 0 ? "page-break" : "";

    return `
      <div class="entry-card ${pageBreakClass}">
        <div class="entry-header" style="background: linear-gradient(135deg, ${colors.primary}, ${colors.accent});">
          <div class="entry-icon" style="background: rgba(255,255,255,0.2);">
            ${icon}
          </div>
          <div class="entry-title-section">
            <div class="entry-title">${entry.title}</div>
            <span class="entry-category">${category}</span>
          </div>
        </div>

        ${includeMetadata ? `
          <div class="entry-metadata">
            <div class="metadata-item">
              <span class="metadata-label">Created:</span>
              <span>${new Date(entry.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">Modified:</span>
              <span>${new Date(entry.updatedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
            </div>
            ${entry.fields.fileName ? `
              <div class="metadata-item">
                <span class="metadata-label">File:</span>
                <span>${entry.fields.fileName}</span>
              </div>
            ` : ""}
          </div>
        ` : ""}

        <div class="entry-content">
          <div class="fields-grid">
            ${regularFields.map(([key, value]) => {
              const formattedValue = formatFieldValue(key, value);
              const isLongText = String(value).length > 100;
              const isCurrency = key.toLowerCase().includes("balance") ||
                                key.toLowerCase().includes("amount") ||
                                key.toLowerCase().includes("price");
              const isMasked = key.toLowerCase().includes("cardnumber") ||
                              key.toLowerCase().includes("accountnumber");

              return `
                <div class="field-item ${isLongText ? "full-width" : ""}" style="border-left-color: ${colors.primary};">
                  <div class="field-label">${formatFieldName(key)}</div>
                  <div class="field-value ${isCurrency ? "currency" : ""} ${isMasked ? "masked" : ""} ${isLongText ? "long-text" : ""}">
                    ${formattedValue}
                  </div>
                </div>
              `;
            }).join("")}

            ${tableFields.map(([key, value]) => `
              <div class="table-section">
                <div class="table-title">${formatFieldName(key)}</div>
                ${isTableDataValue(value) ? renderTableForPrint(value) : ""}
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `;
  }).join("");

  // Count entries by category
  const categoryCounts = entries.reduce((acc, entry) => {
    const cat = entry.fields.category as string || "Personal";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      ${styles}
    </head>
    <body>
      <button class="print-button no-print" onclick="window.print()">🖨️ Print</button>

      <div class="print-container">
        <div class="print-header">
          <div class="print-logo">Save<span>Me</span></div>
          <div class="print-title">${title}</div>
          <div class="print-date">Generated on ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} at ${new Date().toLocaleTimeString()}</div>

          <div class="print-summary">
            <div class="summary-item">
              <span class="summary-count">${entries.length}</span>
              <span>Total Entries</span>
            </div>
            ${Object.entries(categoryCounts).map(([cat, count]) => `
              <div class="summary-item">
                <span>${categoryIcons[cat] || "📋"}</span>
                <span class="summary-count">${count}</span>
                <span>${cat}</span>
              </div>
            `).join("")}
          </div>
        </div>

        ${entriesHTML}

        <div class="print-footer">
          <p>Exported from <a href="https://saveme.space">SaveMe Voice Keeper</a></p>
          <p>Your personal data assistant</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Open print preview in new window
export const openProfessionalPrintPreview = (
  entries: SavedEntry[],
  options?: {
    title?: string;
    includeMetadata?: boolean;
    pageBreaks?: boolean;
  }
): void => {
  const html = generateProfessionalPrintHTML(entries, options);
  const printWindow = window.open("", "_blank", "width=1000,height=800");

  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
};

// Print directly
export const printProfessionally = (
  entries: SavedEntry[],
  options?: {
    title?: string;
    includeMetadata?: boolean;
    pageBreaks?: boolean;
  }
): void => {
  const html = generateProfessionalPrintHTML(entries, options);
  const printWindow = window.open("", "_blank");

  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);
    };
  }
};

export const ProfessionalPrintView: React.FC<ProfessionalPrintViewProps> = ({
  entries,
  title,
  includeMetadata = true,
  pageBreaks = false,
}) => {
  const handlePrint = () => {
    printProfessionally(entries, { title, includeMetadata, pageBreaks });
  };

  const handlePreview = () => {
    openProfessionalPrintPreview(entries, { title, includeMetadata, pageBreaks });
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handlePreview}
        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
      >
        Preview
      </button>
      <button
        onClick={handlePrint}
        className="px-4 py-2 bg-primary text-white hover:bg-primary/90 rounded-lg text-sm font-medium transition-colors"
      >
        Print
      </button>
    </div>
  );
};

export default ProfessionalPrintView;
