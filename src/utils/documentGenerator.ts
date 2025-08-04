import { Document, Packer, Paragraph, TextRun, AlignmentType } from 'docx';
import jsPDF from 'jspdf';
import { DocumentFormat } from '@/components/documents/DocumentFormatSelector';

export interface DocumentData {
  title: string;
  content: string;
  metadata?: {
    author?: string;
    subject?: string;
    keywords?: string;
  };
}

export const generateDocument = async (
  data: DocumentData, 
  format: DocumentFormat
): Promise<Blob> => {
  switch (format) {
    case 'docx':
      return generateWordDocument(data);
    case 'pdf':
      return generatePDFDocument(data);
    case 'rtf':
      return generateRTFDocument(data);
    case 'txt':
      return generateTextDocument(data);
    case 'html':
      return generateHTMLDocument(data);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
};

const generateWordDocument = async (data: DocumentData): Promise<Blob> => {
  // Parse HTML content to extract text and basic formatting
  const parser = new DOMParser();
  const doc = parser.parseFromString(data.content, 'text/html');
  
  const paragraphs: Paragraph[] = [];
  
  // Add title
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: data.title,
          bold: true,
          size: 32,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );
  
  // Process content
  const elements = doc.body.children;
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    
    if (element.tagName === 'P') {
      const textRuns: TextRun[] = [];
      processTextNode(element, textRuns);
      
      if (textRuns.length > 0) {
        paragraphs.push(
          new Paragraph({
            children: textRuns,
            spacing: { after: 200 },
          })
        );
      }
    } else if (element.tagName === 'H1' || element.tagName === 'H2' || element.tagName === 'H3') {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: element.textContent || '',
              bold: true,
              size: element.tagName === 'H1' ? 28 : element.tagName === 'H2' ? 24 : 20,
            }),
          ],
          spacing: { before: 300, after: 200 },
        })
      );
    }
  }
  
  const document = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
    creator: data.metadata?.author || 'Document Creator',
    title: data.title,
    subject: data.metadata?.subject,
    keywords: data.metadata?.keywords,
  });
  
  const buffer = await Packer.toBlob(document);
  return buffer;
};

const processTextNode = (element: Element, textRuns: TextRun[]) => {
  for (let i = 0; i < element.childNodes.length; i++) {
    const node = element.childNodes[i];
    
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      if (text.trim()) {
        textRuns.push(new TextRun({ text }));
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const text = el.textContent || '';
      
      if (text.trim()) {
        textRuns.push(
          new TextRun({
            text,
            bold: el.tagName === 'STRONG' || el.tagName === 'B',
            italics: el.tagName === 'EM' || el.tagName === 'I',
            underline: el.tagName === 'U' ? {} : undefined,
          })
        );
      }
    }
  }
};

const generatePDFDocument = (data: DocumentData): Promise<Blob> => {
  return new Promise((resolve) => {
    const pdf = new jsPDF();
    
    // Add title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text(data.title, pdf.internal.pageSize.getWidth() / 2, 30, { align: 'center' });
    
    // Add content
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    
    // Parse HTML and extract text
    const parser = new DOMParser();
    const doc = parser.parseFromString(data.content, 'text/html');
    const textContent = doc.body.textContent || doc.body.innerText || '';
    
    const lines = pdf.splitTextToSize(textContent, pdf.internal.pageSize.getWidth() - 40);
    pdf.text(lines, 20, 50);
    
    const blob = pdf.output('blob');
    resolve(blob);
  });
};

const generateRTFDocument = (data: DocumentData): Promise<Blob> => {
  return new Promise((resolve) => {
    // Parse HTML content to extract text
    const parser = new DOMParser();
    const doc = parser.parseFromString(data.content, 'text/html');
    const textContent = doc.body.textContent || doc.body.innerText || '';
    
    const rtfContent = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}
\\f0\\fs24 {\\b ${data.title}}\\par\\par
${textContent.replace(/\n/g, '\\par ')}
}`;
    
    const blob = new Blob([rtfContent], { type: 'application/rtf' });
    resolve(blob);
  });
};

const generateTextDocument = (data: DocumentData): Promise<Blob> => {
  return new Promise((resolve) => {
    // Parse HTML content to extract text
    const parser = new DOMParser();
    const doc = parser.parseFromString(data.content, 'text/html');
    const textContent = doc.body.textContent || doc.body.innerText || '';
    
    const content = `${data.title}\n${'='.repeat(data.title.length)}\n\n${textContent}`;
    const blob = new Blob([content], { type: 'text/plain' });
    resolve(blob);
  });
};

const generateHTMLDocument = (data: DocumentData): Promise<Blob> => {
  return new Promise((resolve) => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.title}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { text-align: center; color: #333; }
        .content { line-height: 1.6; }
    </style>
</head>
<body>
    <h1>${data.title}</h1>
    <div class="content">
        ${data.content}
    </div>
</body>
</html>`;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    resolve(blob);
  });
};