import { SavedEntry } from "@/types/dashboard";
import { exportToCSV } from "./csvExport";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export type ExportFormat = 'csv' | 'json' | 'pdf' | 'excel' | 'html';

export interface ExportOptions {
  format: ExportFormat;
  filename?: string;
  includeMetadata?: boolean;
  selectedFields?: string[];
}

export const exportEntries = async (
  entries: SavedEntry[], 
  options: ExportOptions
): Promise<void> => {
  if (entries.length === 0) {
    throw new Error('No data to export');
  }

  const { format, filename = 'form-data', includeMetadata = true } = options;

  switch (format) {
    case 'csv':
      exportToCSV(entries, filename);
      break;
    case 'json':
      exportToJSON(entries, filename, includeMetadata);
      break;
    case 'pdf':
      exportToPDF(entries, filename, includeMetadata);
      break;
    case 'excel':
      exportToExcel(entries, filename, includeMetadata);
      break;
    case 'html':
      exportToHTML(entries, filename, includeMetadata);
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
};

const exportToJSON = (entries: SavedEntry[], filename: string, includeMetadata: boolean) => {
  const exportData = entries.map(entry => {
    const data: Record<string, unknown> & { _metadata?: { id: string; title: string; createdAt: string; updatedAt: string } } = { ...entry.fields };
    
    if (includeMetadata) {
      data._metadata = {
        id: entry.id,
        title: entry.title,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt
      };
    }
    
    return data;
  });

  const jsonContent = JSON.stringify(exportData, null, 2);
  downloadFile(jsonContent, `${filename}-${getDateString()}.json`, 'application/json');
};

const exportToPDF = (entries: SavedEntry[], filename: string, includeMetadata: boolean) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text('Exported Data', 20, 20);
  
  // Add export date
  doc.setFontSize(10);
  doc.text(`Exported on: ${new Date().toLocaleDateString()}`, 20, 30);
  
  // Get all unique field names
  const allFieldNames = new Set<string>();
  entries.forEach(entry => {
    Object.keys(entry.fields).forEach(field => {
      allFieldNames.add(field);
    });
  });

  // Prepare table data
  const headers = [];
  if (includeMetadata) {
    headers.push('Title', 'Created', 'Updated');
  }
  headers.push(...Array.from(allFieldNames).sort());

  const tableData = entries.map(entry => {
    const row: string[] = [];
    
    if (includeMetadata) {
      row.push(
        entry.title,
        new Date(entry.createdAt).toLocaleDateString(),
        new Date(entry.updatedAt).toLocaleDateString()
      );
    }
    
    Array.from(allFieldNames).sort().forEach(fieldName => {
      const value = entry.fields[fieldName];
      row.push(value ? String(value) : '');
    });
    
    return row;
  });

  // Add table to PDF
  autoTable(doc, {
    head: [headers],
    body: tableData,
    startY: 40,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [66, 139, 202] },
    margin: { top: 40 }
  });

  doc.save(`${filename}-${getDateString()}.pdf`);
};

const exportToExcel = (entries: SavedEntry[], filename: string, includeMetadata: boolean) => {
  // Security hardening: XLSX dependency removed due unresolved high-severity advisories.
  // Export Excel-compatible SpreadsheetML XML instead (opens in Excel).

  const allFieldNames = new Set<string>();
  entries.forEach(entry => {
    Object.keys(entry.fields).forEach(field => {
      allFieldNames.add(field);
    });
  });

  const headers: string[] = [];
  if (includeMetadata) {
    headers.push('Title', 'Created Date', 'Updated Date');
  }
  headers.push(...Array.from(allFieldNames).sort());

  const rows = entries.map(entry => {
    const cells: string[] = [];
    if (includeMetadata) {
      cells.push(
        entry.title,
        new Date(entry.createdAt).toLocaleDateString(),
        new Date(entry.updatedAt).toLocaleDateString()
      );
    }

    Array.from(allFieldNames).sort().forEach(fieldName => {
      const value = entry.fields[fieldName];
      cells.push(value ? String(value) : '');
    });

    return cells;
  });

  const escapeXml = (value: string) => value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  const xmlRows = [headers, ...rows]
    .map(row => `      <Row>${row.map(cell => `<Cell><Data ss:Type="String">${escapeXml(cell)}</Data></Cell>`).join('')}</Row>`)
    .join('\n');

  const spreadsheetXml = `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
  <Worksheet ss:Name="Exported Data">
    <Table>
${xmlRows}
    </Table>
  </Worksheet>
</Workbook>`;

  downloadFile(
    spreadsheetXml,
    `${filename}-${getDateString()}.xls`,
    'application/vnd.ms-excel'
  );
};

const exportToHTML = (entries: SavedEntry[], filename: string, includeMetadata: boolean) => {
  // Get all unique field names
  const allFieldNames = new Set<string>();
  entries.forEach(entry => {
    Object.keys(entry.fields).forEach(field => {
      allFieldNames.add(field);
    });
  });

  const headers = [];
  if (includeMetadata) {
    headers.push('Title', 'Created', 'Updated');
  }
  headers.push(...Array.from(allFieldNames).sort());

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Exported Data</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .header { margin-bottom: 20px; }
        .export-date { color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Exported Data</h1>
        <p class="export-date">Exported on: ${new Date().toLocaleDateString()}</p>
    </div>
    
    <table>
        <thead>
            <tr>
                ${headers.map(header => `<th>${header}</th>`).join('')}
            </tr>
        </thead>
        <tbody>
            ${entries.map(entry => {
              const cells = [];
              if (includeMetadata) {
                cells.push(
                  entry.title,
                  new Date(entry.createdAt).toLocaleDateString(),
                  new Date(entry.updatedAt).toLocaleDateString()
                );
              }
              
              Array.from(allFieldNames).sort().forEach(fieldName => {
                const value = entry.fields[fieldName];
                cells.push(value ? String(value) : '');
              });
              
              return `<tr>${cells.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
            }).join('')}
        </tbody>
    </table>
</body>
</html>`;

  downloadFile(htmlContent, `${filename}-${getDateString()}.html`, 'text/html');
};

const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

const getDateString = () => {
  return new Date().toISOString().split('T')[0];
};

export const getExportFormatIcon = (format: ExportFormat) => {
  switch (format) {
    case 'csv': return '📊';
    case 'json': return '📋';
    case 'pdf': return '📄';
    case 'excel': return '📗';
    case 'html': return '🌐';
    default: return '📁';
  }
};

export const getExportFormatName = (format: ExportFormat) => {
  switch (format) {
    case 'csv': return 'CSV';
    case 'json': return 'JSON';
    case 'pdf': return 'PDF';
    case 'excel': return 'Excel';
    case 'html': return 'HTML';
    default: return 'Unknown';
  }
};