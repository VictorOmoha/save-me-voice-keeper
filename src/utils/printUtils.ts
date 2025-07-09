import { SavedEntry } from "@/types/dashboard";

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
        body { margin: 0; font-family: Arial, sans-serif; }
        .no-print { display: none !important; }
        .page-break { page-break-before: always; }
        .entry-card { 
          border: 1px solid #ddd; 
          margin-bottom: 20px; 
          padding: 15px;
          break-inside: avoid;
        }
        .entry-title { 
          font-size: 18px; 
          font-weight: bold; 
          margin-bottom: 10px; 
          color: #333;
        }
        .entry-metadata { 
          font-size: 12px; 
          color: #666; 
          margin-bottom: 15px;
          border-bottom: 1px solid #eee;
          padding-bottom: 10px;
        }
        .field-grid { 
          display: grid; 
          gap: 10px; 
        }
        .field-item { 
          display: flex; 
          flex-direction: column; 
          gap: 5px;
        }
        .field-label { 
          font-weight: bold; 
          color: #333; 
          font-size: 14px;
        }
        .field-value { 
          color: #555; 
          font-size: 14px;
          word-break: break-word;
        }
        .print-header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #333;
          padding-bottom: 10px;
        }
        .print-title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .print-date {
          font-size: 14px;
          color: #666;
        }
        .entry-count {
          font-size: 16px;
          color: #666;
          margin-bottom: 20px;
        }
      }
      @media screen {
        .print-preview {
          max-width: 8.5in;
          margin: 0 auto;
          padding: 20px;
          background: white;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
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
              <div class="field-label">${formatFieldName(key)}</div>
              <div class="field-value">${value || 'No data'}</div>
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

const formatFieldName = (fieldName: string) => {
  return fieldName
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
    .trim();
};

const openPrintWindow = (content: string) => {
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  
  if (printWindow) {
    printWindow.document.write(content);
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  } else {
    // Fallback if popup is blocked
    const printFrame = document.createElement('iframe');
    printFrame.style.display = 'none';
    document.body.appendChild(printFrame);
    
    if (printFrame.contentWindow) {
      printFrame.contentWindow.document.write(content);
      printFrame.contentWindow.document.close();
      printFrame.contentWindow.print();
    }
    
    setTimeout(() => {
      document.body.removeChild(printFrame);
    }, 100);
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