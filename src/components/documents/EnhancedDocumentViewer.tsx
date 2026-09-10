import { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, FileText, Eye, X, Edit3, ZoomIn, ZoomOut, RotateCw, Maximize2, Save, Printer } from 'lucide-react';
import { SavedEntry } from '@/types/dashboard';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import {downloadDocumentBlob} from '@/utils/documentStorage';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { Document, Page, pdfjs } from 'react-pdf';
import mammoth from 'mammoth';
import { RichTextEditor } from '@/components/documents/RichTextEditor';
import { printBlobDocument, printDocumentHtml } from '@/utils/printUtils';
import DOMPurify from 'dompurify';
import { EntryIntelligencePanel } from '@/components/entries/EntryIntelligencePanel';
import { fieldValueToText } from '@/utils/fieldValueGuards';

// Configure pdfjs worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface EnhancedDocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  entry: SavedEntry | null;
  onEdit?: (entry: SavedEntry) => void;
  allEntries?: SavedEntry[];
  onOpenRelatedEntry?: (entry: SavedEntry) => void;
}

interface DocumentState {
  content: string | null;
  blob: Blob | null;
  numPages: number | null;
  currentPage: number;
  scale: number;
  rotation: number;
  isFullscreen: boolean;
}

export const EnhancedDocumentViewer: React.FC<EnhancedDocumentViewerProps> = ({
  isOpen,
  onClose,
  entry,
  onEdit,
  allEntries = [],
  onOpenRelatedEntry,
}) => {
  const { user } = useAuth();
  // Removed early return to maintain consistent hooks usage

  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const loadVersion = useRef(0);
  const [documentState, setDocumentState] = useState<DocumentState>({
    content: null,
    blob: null,
    numPages: null,
    currentPage: 1,
    scale: 1.0,
    rotation: 0,
    isFullscreen: false
  });

  // Notes editor state
  const [notesHtml, setNotesHtml] = useState<string>('');
  const [initialNotesHtml, setInitialNotesHtml] = useState<string>('');
  const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);

  const isDocumentEntry = entry?.fields?.category === 'Documents' && Boolean(entry?.fields?.hasUploadedFile);
  const fileName = (entry?.fields?.fileName as string) || '';
  const fileType = (entry?.fields?.fileType as string) || '';
  const fileSize = Number(entry?.fields?.fileSize || 0);
  const storedContent = (entry?.fields?.documentContent as string) || '';

  const hasInline = Boolean(storedContent);
  const isTextBased = hasInline || fileType.includes('text') || fileType.includes('html') || fileName.endsWith('.txt') || fileName.endsWith('.html');
  const isPdf = fileType.includes('pdf') || fileName.endsWith('.pdf');
  const isWordDoc = fileName.endsWith('.docx') || fileType.includes('wordprocessingml.document') || fileType.toLowerCase().includes('docx');
  const isRtf = fileType.includes('rtf') || fileName.endsWith('.rtf');

  const textToHtml = (text: string) => {
    const esc = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const withBreaks = esc.split('\n').join('<br>');
    return `<p>${withBreaks}</p>`;
  };

  useEffect(() => {
    if (!isOpen || !entry) return;
    const existingHtml = (entry.fields?.documentNotesHtml as string) ||
      (typeof entry.fields?.notes === 'string' ? textToHtml(entry.fields.notes as string) : '');
    setNotesHtml(existingHtml);
    setInitialNotesHtml(existingHtml);
  }, [isOpen, entry]);

  const loadDocument = useCallback(async () => {
    if (!entry) return;
    const version = ++loadVersion.current;
    setIsLoading(true); setLoadError(null);
    setDocumentState(prev => ({...prev, blob:null, content:null, currentPage:1, numPages:null}));
    try {
      const explicitPath = entry.fields.storagePath as string | undefined;
      const path = explicitPath || (user ? `documents/${user.uid}/${entry.id}/${fileName}` : '');
      let blob: Blob | null = null;
      let content: string | null = null;
      let downloadError: unknown;
      if (path) {
        try {blob = await downloadDocumentBlob(path);} catch (error) {downloadError = error;}
      }
      // Legacy cached documents are optional; a malformed cache must not break the viewer.
      if (!blob) {
        for (const key of Object.keys(localStorage).filter(key => key.startsWith('document_'))) {
          try {
            const cached = JSON.parse(localStorage.getItem(key) || '{}');
            if (cached.name !== fileName) continue;
            const bytes = Uint8Array.from(atob(cached.data.split(',')[1]), char => char.charCodeAt(0));
            blob = new Blob([bytes], {type:cached.type}); break;
          } catch { /* Ignore malformed legacy cache entries. */ }
        }
      }
      if (blob && isWordDoc) content = (await mammoth.convertToHtml({arrayBuffer:await blob.arrayBuffer()})).value;
      else if (blob && isTextBased) content = await blob.text();
      else if (!blob && storedContent && isTextBased) content = storedContent;
      if (!blob && content === null) throw downloadError || new Error('The file could not be found. Please try again.');
      if (loadVersion.current === version) setDocumentState(prev => ({...prev,blob,content}));
    } catch (error) {
      if (loadVersion.current === version) setLoadError(error instanceof Error ? error.message : 'The document could not load. Please try again.');
    } finally {if (loadVersion.current === version) setIsLoading(false);}
  }, [entry,fileName,isTextBased,isWordDoc,storedContent,user]);

  const invalidateLoad = useCallback(() => {loadVersion.current++;}, []);
  useEffect(() => {
    if (isOpen && entry && isDocumentEntry) void loadDocument();
    return invalidateLoad;
  }, [isOpen,entry,isDocumentEntry,loadDocument,invalidateLoad]);

  useEffect(() => {
    const handleNovaClose = () => {
      if (isOpen) onClose();
    };

    window.addEventListener('nova:close', handleNovaClose);
    return () => window.removeEventListener('nova:close', handleNovaClose);
  }, [isOpen, onClose]);

  const handleDownload = async () => {
    if (!isDocumentEntry || !documentState.blob) return;

    try {
      const url = URL.createObjectURL(documentState.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Document downloaded!');
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  const handleEdit = () => {
    if (onEdit && entry) {
      onEdit(entry);
    }
  };

  const handlePrint = async () => {
    try {
      const title = entry?.title || fileName || 'Document';
      if (isPdf && documentState.blob) {
        printBlobDocument(documentState.blob, fileName);
        toast.success('Opening print dialog...');
        return;
      }
      if (isWordDoc) {
        // Ensure we have HTML content; if not, convert on the fly
        let html = documentState.content;
        if (!html && documentState.blob) {
          toast.message('Preparing document for print...');
          try {
            const arrayBuffer = await documentState.blob.arrayBuffer();
            
            // Validate the document before conversion
            const uint8Array = new Uint8Array(arrayBuffer);
            const header = uint8Array.slice(0, 4);
            const isZipFile = header[0] === 0x50 && header[1] === 0x4B;
            
            if (!isZipFile) {
              toast.error('Invalid Word document format for printing');
              return;
            }

            const result = await mammoth.convertToHtml({ arrayBuffer });
            html = result.value;
            setDocumentState(prev => ({ ...prev, content: html! }));
          } catch (err) {
            console.error('Conversion failed during print:', err);
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            
            if (errorMessage.includes('zip file') || errorMessage.includes('central directory')) {
              toast.error('Invalid Word document format for printing');
            } else {
              toast.error('Failed to prepare Word document for printing');
            }
            return;
          }
        }
        if (html) {
          printDocumentHtml(title, html);
          toast.success('Opening print dialog...');
          return;
        }
      }
      if (isTextBased) {
        const content = documentState.content;
        if (content) {
          const body = fileName.endsWith('.html') ? content : textToHtml(content);
          printDocumentHtml(title, body);
          toast.success('Opening print dialog...');
          return;
        }
      }
      toast.error('Nothing to print');
    } catch (e) {
      console.error('Error printing document:', e);
      toast.error('Failed to open print dialog');
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setDocumentState(prev => ({ ...prev, numPages }));
  };

  const changePage = (offset: number) => {
    setDocumentState(prev => ({
      ...prev,
      currentPage: Math.max(1, Math.min(prev.currentPage + offset, prev.numPages || 1))
    }));
  };

  const changeScale = (scaleOffset: number) => {
    setDocumentState(prev => ({
      ...prev,
      scale: Math.max(0.5, Math.min(prev.scale + scaleOffset, 3.0))
    }));
  };

  const rotate = () => {
    setDocumentState(prev => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360
    }));
  };

  const toggleFullscreen = () => {
    setDocumentState(prev => ({
      ...prev,
      isFullscreen: !prev.isFullscreen
    }));
  };

  // Save notes to Firebase (entries.fields.documentNotesHtml)
  const handleSaveNotes = async () => {
    if (!entry) return;
    try {
      setIsSavingNotes(true);
      const updatedFields = { ...(entry.fields || {}), documentNotesHtml: notesHtml };
      const entryRef = doc(db, 'entries', entry.id);
      await updateDoc(entryRef, { fields: updatedFields });

      setInitialNotesHtml(notesHtml);
      toast.success('Notes saved');
    } catch (err) {
      console.error('Error saving notes:', err);
      toast.error('Failed to save notes');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const canView = isPdf || isWordDoc || isTextBased;
  const canEdit = isTextBased; // For now, only allow editing of text-based files

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`workspace-shell w-[calc(100%-2rem)] rounded-2xl ${documentState.isFullscreen ? 'max-w-[95vw] max-h-[95vh]' : 'max-w-4xl max-h-[90dvh]'} overflow-hidden flex flex-col`}>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>{entry?.title || 'Document'}</span>
            </div>
            <div className="flex items-center space-x-2">
              {canView && (
                <>
                  {isPdf && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => changePage(-1)}
                        disabled={documentState.currentPage <= 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {documentState.currentPage} / {documentState.numPages || 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => changePage(1)}
                        disabled={documentState.currentPage >= (documentState.numPages || 1)}
                      >
                        Next
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => changeScale(-0.1)}
                        disabled={documentState.scale <= 0.5}
                      >
                        <ZoomOut className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => changeScale(0.1)}
                        disabled={documentState.scale >= 3.0}
                      >
                        <ZoomIn className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={rotate}
                      >
                        <RotateCw className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleFullscreen}
                  >
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
        </DialogTitle>
        <DialogDescription className="sr-only">
          View and manage the selected document. Use the Editor to print Word or text documents; only PDFs can be printed here.
        </DialogDescription>
      </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {!documentState.isFullscreen && entry && (
            <EntryIntelligencePanel
              entry={entry}
              allEntries={allEntries}
              onOpenEntry={onOpenRelatedEntry}
            />
          )}

          {/* Document Information */}
          {!documentState.isFullscreen && (
            <div className="flex-shrink-0 bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Document Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">File Name:</span>
                  <p className="text-muted-foreground">{fileName || 'Not specified'}</p>
                </div>
                <div>
                  <span className="font-medium">File Type:</span>
                  <p className="text-muted-foreground">{fieldValueToText(entry?.fields?.documentType) || 'Unknown'}</p>
                </div>
                <div>
                  <span className="font-medium">File Size:</span>
                  <p className="text-muted-foreground">{formatFileSize(fileSize)}</p>
                </div>
                <div>
                  <span className="font-medium">Created:</span>
                  <p className="text-muted-foreground">{entry?.createdAt ? entry.createdAt.toLocaleDateString() : ''}</p>
                </div>
              </div>
            </div>
          )}

          {loadError && <div role="alert" className="rounded-xl border border-destructive/30 p-4 text-sm"><p>{loadError}</p><Button variant="outline" className="mt-3" onClick={() => void loadDocument()}>Try download again</Button></div>}

          {/* Document Actions */}
          {isDocumentEntry && !documentState.isFullscreen && (
            <div className="flex-shrink-0 flex flex-wrap gap-3">
              <Button 
                onClick={handleDownload} 
                disabled={isLoading || !documentState.blob}
                className="flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </Button>

{isPdf && (
  <Button
    onClick={handlePrint}
    variant="outline"
    disabled={isLoading || !documentState.blob}
    className="flex items-center space-x-2"
  >
    <Printer className="w-4 h-4" />
    <span>Print</span>
  </Button>
)}
{!isPdf && (isWordDoc || isTextBased) && (
  <span className="text-sm text-muted-foreground">
    To print, open in Editor and use its Print button.
  </span>
)}
              
              {canEdit && onEdit && (
                <Button 
                  onClick={handleEdit} 
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit</span>
                </Button>
              )}
            </div>
          )}


          {/* Document Viewer */}
          <div className="flex-1 overflow-auto border border-border rounded-lg">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2 text-muted-foreground">Loading document...</span>
              </div>
            ) : (
              <>
                {/* PDF Viewer */}
                {isPdf && documentState.blob && (
                  <div className="flex justify-center p-4 bg-gray-50 dark:bg-gray-900">
                    <div className="w-full max-w-4xl">
                      <Document
                        file={documentState.blob}
                        onLoadSuccess={onDocumentLoadSuccess}
                        className="max-w-full"
                        error={
                          <div className="text-center p-8">
                            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">
                              Unable to display PDF. Please download to view.
                            </p>
                            <Button onClick={handleDownload} className="mt-4">
                              <Download className="w-4 h-4 mr-2" />
                              Download PDF
                            </Button>
                          </div>
                        }
                        loading={
                          <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            <span className="ml-2">Loading PDF...</span>
                          </div>
                        }
                      >
                        <Page
                          pageNumber={documentState.currentPage}
                          scale={documentState.scale}
                          rotate={documentState.rotation}
                          className="max-w-full shadow-lg"
                          renderTextLayer={false}
                          renderAnnotationLayer={false}
                        />
                      </Document>
                    </div>
                  </div>
                )}

                {/* Word Document Viewer */}
                {isWordDoc && documentState.content && (
                  <div className="p-4">
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(documentState.content) }}
                    />
                  </div>
                )}

                {/* Text-based Document Viewer */}
                {isTextBased && documentState.content && (
                  <div className="p-4">
                    {fileName.endsWith('.html') ? (
                      <div 
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(documentState.content) }}
                      />
                    ) : (
                      <pre className="whitespace-pre-wrap text-sm text-foreground font-mono">
                        {documentState.content}
                      </pre>
                    )}
                  </div>
                )}

                {/* Unsupported file type */}
                {!canView && (
                  <div className="flex flex-col items-center justify-center h-64 text-center p-4">
                    <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">Preview not available</h3>
                    <p className="text-muted-foreground mb-4">
                      This file type cannot be previewed in the browser. 
                      Please download the file to view it.
                    </p>
                    <Button onClick={handleDownload} disabled={!documentState.blob}>
                      <Download className="w-4 h-4 mr-2" />
                      Download File
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 flex justify-end pt-4">
          <Button onClick={onClose} variant="outline">
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
