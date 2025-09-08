import { SavedEntry } from "@/types/dashboard";
import { TableData } from "@/components/forms/types";
import { toDisplayFieldName } from "./fieldNameNormalizer";

export interface PrintOptions {
  includeMetadata?: boolean;
  selectedFields?: string[];
  pageBreakBetweenEntries?: boolean;
  fontSize?: 'small' | 'medium' | 'large';
}

export const printEntries = (entries: SavedEntry[], options: PrintOptions = {}) => {
  const {
    includeMetadata = true,
    pageBreakBetweenEntries = false,
    fontSize = 'medium'
  } = options;

  const printContent = generatePrintHTML(entries, {
    includeMetadata,
    pageBreakBetweenEntries,
    fontSize
  });

  openPrintWindow(printContent);
};

export const printSingleEntry = (entry: SavedEntry, options: PrintOptions = {}) => {
  printEntries([entry], options);
};

// Helper function to render field values based on their type and content
const renderFieldValue = (key: string, value: any, fieldDefinitions?: any[]): string => {
  if (value === null || value === undefined || value === '') {
    return '<span class="text-muted">No data</span>';
  }

  // Handle table data
  if (value && typeof value === 'object' && 'columns' in value && 'rows' in value) {
    const tableData = value as TableData;
    if (!tableData.columns || tableData.columns.length === 0) {
      return '<span class="text-muted">Empty table</span>';
    }

    return `
      <div class="table-container">
        <div class="table-info">Table with ${tableData.rows.length} rows, ${tableData.columns.length} columns</div>
        <table class="data-table">
          <thead>
            <tr>
              ${tableData.columns.map(col => `
                <th class="table-header">
                  <div>${col.name}</div>
                  <div class="column-type">(${col.type})</div>
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            ${tableData.rows.map(row => `
              <tr>
                ${tableData.columns.map(col => `
                  <td class="table-cell">
                    ${renderTableCellValue(row[col.id], col.type)}
                  </td>
                `).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // Handle arrays (like image galleries)
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '<span class="text-muted">No items</span>';
    }
    
    // Check if it's an array of image URLs
    const isImageArray = value.some(item => 
      typeof item === 'string' && (
        item.includes('blob:') || 
        item.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
      )
    );
    
    if (isImageArray) {
      return `
        <div class="image-gallery">
          <div class="gallery-info">${value.length} image${value.length !== 1 ? 's' : ''}</div>
          ${value.map((url, index) => `
            <div class="image-item">
              <span class="image-label">Image ${index + 1}</span>
              <div class="image-preview">📷 ${extractFileName(url)}</div>
            </div>
          `).join('')}
        </div>
      `;
    }
    
    // Regular array
    return `
      <div class="list-container">
        ${value.map((item, index) => `
          <div class="list-item">
            <span class="list-index">${index + 1}.</span>
            <span class="list-value">${String(item)}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Handle dates
  if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)))) {
    const date = new Date(value);
    return `<span class="date-value">${date.toLocaleDateString()} ${date.toLocaleTimeString()}</span>`;
  }

  // Handle numbers
  if (typeof value === 'number') {
    return `<span class="number-value">${value.toLocaleString()}</span>`;
  }

  // Handle booleans
  if (typeof value === 'boolean') {
    return `<span class="boolean-value">${value ? '✓ Yes' : '✗ No'}</span>`;
  }

  // Handle long text (textarea)
  if (typeof value === 'string' && value.length > 100) {
    return `<div class="long-text">${value.replace(/\n/g, '<br>')}</div>`;
  }

  // Handle URLs
  if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('blob:'))) {
    if (value.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) || value.includes('blob:')) {
      return `<div class="image-reference">📷 ${extractFileName(value)}</div>`;
    }
    return `<a href="${value}" class="url-link">${value}</a>`;
  }

  // Default string handling
  return `<span class="text-value">${String(value)}</span>`;
};

const renderTableCellValue = (value: any, columnType: string): string => {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  switch (columnType) {
    case 'checkbox':
      return value ? '✓' : '✗';
    case 'number':
      return typeof value === 'number' ? value.toLocaleString() : String(value);
    case 'date':
      return new Date(value).toLocaleDateString();
    default:
      return String(value);
  }
};

const extractFileName = (url: string): string => {
  if (url.includes('blob:')) {
    return 'Uploaded image';
  }
  const match = url.match(/\/([^\/]+\.[^\/]+)$/);
  return match ? match[1] : 'Image file';
};

const generatePrintHTML = (entries: SavedEntry[], options: PrintOptions) => {
  const { includeMetadata, pageBreakBetweenEntries, fontSize } = options;
  
  const fontSizeClass = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg'
  }[fontSize || 'medium'];

  const printStyles = `
    <style>
      @media print {
        body { 
          margin: 0; 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.4;
          color: #222;
        }
        .no-print { display: none !important; }
        .page-break { page-break-before: always; }
        
        .entry-card { 
          border: 2px solid #e1e5e9; 
          margin-bottom: 24px; 
          padding: 20px;
          break-inside: avoid;
          border-radius: 8px;
          background: #fafbfc;
        }
        
        .entry-title { 
          font-size: 20px; 
          font-weight: 700; 
          margin-bottom: 12px; 
          color: #1a1a1a;
          border-bottom: 2px solid #4f46e5;
          padding-bottom: 8px;
        }
        
        .entry-metadata { 
          font-size: 11px; 
          color: #6b7280; 
          margin-bottom: 16px;
          background: #f3f4f6;
          padding: 8px 12px;
          border-radius: 4px;
          border-left: 4px solid #4f46e5;
        }
        
        .field-grid { 
          display: grid; 
          gap: 16px; 
        }
        
        .field-item { 
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 12px;
        }
        
        .field-label { 
          font-weight: 600; 
          color: #374151; 
          font-size: 13px;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .field-value { 
          color: #1f2937; 
          font-size: 14px;
          line-height: 1.5;
        }
        
        .text-muted { color: #9ca3af; font-style: italic; }
        .date-value { font-family: monospace; color: #059669; }
        .number-value { font-family: monospace; color: #dc2626; text-align: right; }
        .boolean-value { font-weight: 600; }
        .long-text { white-space: pre-wrap; line-height: 1.6; }
        .url-link { color: #2563eb; text-decoration: underline; }
        
        .table-container { 
          margin: 8px 0;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          overflow: hidden;
        }
        
        .table-info {
          background: #f9fafb;
          padding: 8px 12px;
          font-size: 12px;
          color: #6b7280;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .data-table { 
          width: 100%; 
          border-collapse: collapse; 
          font-size: 12px;
        }
        
        .table-header { 
          background: #f3f4f6; 
          padding: 8px; 
          border: 1px solid #d1d5db; 
          font-weight: 600;
          text-align: left;
          color: #374151;
        }
        
        .column-type {
          font-size: 10px;
          color: #9ca3af;
          font-weight: normal;
        }
        
        .table-cell { 
          padding: 6px 8px; 
          border: 1px solid #e5e7eb; 
          vertical-align: top;
        }
        
        .image-gallery, .list-container {
          margin: 8px 0;
        }
        
        .gallery-info, .image-item, .list-item {
          padding: 4px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        
        .gallery-info {
          font-weight: 600;
          color: #374151;
          font-size: 12px;
        }
        
        .image-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .image-label {
          font-weight: 500;
          color: #6b7280;
          font-size: 11px;
        }
        
        .image-preview, .image-reference {
          color: #059669;
          font-size: 12px;
        }
        
        .list-item {
          display: flex;
          gap: 8px;
        }
        
        .list-index {
          font-weight: 600;
          color: #6b7280;
          min-width: 20px;
        }
        
        .print-header {
          text-align: center;
          margin-bottom: 32px;
          border-bottom: 3px solid #1f2937;
          padding-bottom: 16px;
        }
        
        .print-title {
          font-size: 28px;
          font-weight: 800;
          margin-bottom: 8px;
          color: #1f2937;
        }
        
        .print-date {
          font-size: 14px;
          color: #6b7280;
        }
        
        .entry-count {
          font-size: 16px;
          color: #4b5563;
          margin-bottom: 24px;
          background: #f9fafb;
          padding: 12px;
          border-radius: 8px;
          border-left: 4px solid #10b981;
        }
      }
      
      @media screen {
        .print-preview {
          max-width: 8.5in;
          margin: 0 auto;
          padding: 24px;
          background: white;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
        }
      }
    </style>
  `;

  const headerHTML = `
    <div class="print-header">
      <div class="print-title">Exported Data</div>
      <div class="print-date">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
    </div>
    <div class="entry-count">${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}</div>
  `;

  const entriesHTML = entries.map((entry, index) => {
    const pageBreak = pageBreakBetweenEntries && index > 0 ? 'page-break' : '';
    
    return `
      <div class="entry-card ${pageBreak}">
        <div class="entry-title">${entry.title}</div>
        
        ${includeMetadata ? `
          <div class="entry-metadata">
            <div><strong>Created:</strong> ${new Date(entry.createdAt).toLocaleDateString()}</div>
            <div><strong>Last Modified:</strong> ${new Date(entry.updatedAt).toLocaleDateString()}</div>
          </div>
        ` : ''}
        
        <div class="field-grid">
          ${Object.entries(entry.fields).map(([key, value]) => `
            <div class="field-item">
              <div class="field-label">${toDisplayFieldName(key)}</div>
              <div class="field-value">${renderFieldValue(key, value, entry.fieldDefinitions)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Print Preview</title>
      ${printStyles}
    </head>
    <body class="${fontSizeClass}">
      <div class="print-preview">
        ${headerHTML}
        ${entriesHTML}
      </div>
    </body>
    </html>
  `;
};


const openPrintWindow = (content: string) => {
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  
  if (printWindow) {
    // Write the content and ensure the print happens after rendering
    printWindow.document.open();
    printWindow.document.write(content);
    printWindow.document.close();

    const attemptPrint = () => {
      try {
        printWindow.focus();
        printWindow.print();
      } catch (e) {
        // ignore and let the fallback try again
      }
    };

    // If the document is already loaded, print shortly after
    if (printWindow.document.readyState === 'complete') {
      setTimeout(attemptPrint, 400);
    } else {
      // Otherwise wait for load
      printWindow.addEventListener('load', () => setTimeout(attemptPrint, 400));
    }

    // Final safety retry in case the above events didn't fire
    setTimeout(attemptPrint, 1500);
  } else {
    // Fallback if popup is blocked
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const iframeDoc = printFrame.contentWindow?.document;
    if (iframeDoc) {
      iframeDoc.open();
      iframeDoc.write(content);
      iframeDoc.close();
      const tryIframePrint = () => {
        try {
          printFrame.contentWindow?.focus();
          printFrame.contentWindow?.print();
        } catch {}
      };
      if (printFrame.contentWindow?.document.readyState === 'complete') {
        setTimeout(tryIframePrint, 400);
      } else {
        printFrame.addEventListener('load', () => setTimeout(tryIframePrint, 400));
      }
      setTimeout(tryIframePrint, 1500);
    }

    setTimeout(() => {
      try { document.body.removeChild(printFrame); } catch {}
    }, 4000);
  }
};

export const openPrintPreview = (entries: SavedEntry[], options: PrintOptions = {}) => {
  const printContent = generatePrintHTML(entries, options);
  const previewWindow = window.open('', '_blank', 'width=1000,height=800');
  
  if (previewWindow) {
    previewWindow.document.write(printContent);
    previewWindow.document.close();
    
    // Add print button to preview
    previewWindow.onload = () => {
      const printButton = previewWindow.document.createElement('button');
      printButton.textContent = 'Print';
      printButton.className = 'no-print';
      printButton.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        padding: 10px 20px;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        z-index: 1000;
      `;
      
      printButton.onclick = () => {
        previewWindow.print();
      };
      
      previewWindow.document.body.appendChild(printButton);
    };
  }
};

// Print an HTML document body with a header
export const printDocumentHtml = (title: string, htmlBody: string) => {
  const styles = `
    <style>
      @media print {
        body { margin: 24px; font-family: Arial, sans-serif; color: #111; }
        .print-header { text-align: center; margin-bottom: 16px; border-bottom: 2px solid #333; padding-bottom: 8px; }
        .print-title { font-size: 22px; font-weight: 700; margin: 0 0 4px 0; }
        .print-date { font-size: 12px; color: #666; margin: 0; }
        .content { margin-top: 16px; }
        pre { white-space: pre-wrap; word-wrap: break-word; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
      }
    </style>
  `;
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        ${styles}
      </head>
      <body>
        <div class="print-header">
          <div class="print-title">${title}</div>
          <div class="print-date">Printed on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
        </div>
        <div class="content">${htmlBody}</div>
      </body>
    </html>
  `;
  openPrintWindow(html);
};

// Print a Blob (e.g., PDF) by embedding it in an iframe and invoking print
export const printBlobDocument = (blob: Blob, fileName?: string) => {
  const url = URL.createObjectURL(blob);
  const printWindow = window.open('', '_blank', 'width=1000,height=800');
  if (!printWindow) return;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${fileName || 'Document'}</title>
        <style>
          html, body, iframe { height: 100%; width: 100%; margin: 0; }
          .toolbar { position: fixed; top: 10px; right: 10px; z-index: 1000; }
          .toolbar button { padding: 8px 12px; background: #2563eb; color: #fff; border: 0; border-radius: 6px; cursor: pointer; }
          @media print { .toolbar { display: none; } }
        </style>
      </head>
      <body>
        <div class="toolbar">
          <button onclick="window.focus(); window.print();">Print</button>
        </div>
        <iframe src="${url}" style="border:0;" onload="setTimeout(function(){ window.focus(); window.print(); }, 800);"></iframe>
      </body>
    </html>
  `;
  printWindow.document.write(html);
  printWindow.document.close();
};