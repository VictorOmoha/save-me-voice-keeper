import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save, X, FileText, Edit3, Printer } from 'lucide-react';
import { SavedEntry } from '@/types/dashboard';
import { storage, db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { ref, uploadBytes, getBlob } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
const RichTextEditor = lazy(() =>
  import('./RichTextEditor').then((module) => ({ default: module.RichTextEditor }))
);

interface DocumentEditorProps {
  isOpen: boolean;
  onClose: () => void;
  entry: SavedEntry | null;
  onSave?: (updatedEntry: SavedEntry) => void;
}

export const DocumentEditor: React.FC<DocumentEditorProps> = ({
  isOpen,
  onClose,
  entry,
  onSave
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [documentContent, setDocumentContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [hasChanges, setHasChanges] = useState(false);

  

  const fileName = entry?.fields?.fileName || '';
  const fileType = entry?.fields?.fileType || '';
  const hasInline = Boolean((entry?.fields as Record<string, unknown> | undefined)?.documentContent);
  const isTextBased = hasInline || fileType.includes('text') || fileType.includes('html') || fileName.endsWith('.txt') || fileName.endsWith('.html');
  const isHtml = fileName.endsWith('.html') || fileType.includes('html');

  const loadDocumentForEditing = useCallback(async () => {
    if (!entry) return;

    try {
      setIsLoading(true);

      if (!user) {
        console.warn('No authenticated user while loading document');
      }

      const explicitPath = (entry.fields as Record<string, unknown>)?.storagePath as string | undefined;
      const defaultFileName = fileName || 'document.txt';
      const computedPath = user ? `documents/${user.uid}/${entry.id}/${defaultFileName}` : `documents/${entry.id}/${defaultFileName}`;
      const filePath = explicitPath || computedPath;

      if (filePath) {
        try {
          const storageRef = ref(storage, filePath);
          const blob = await getBlob(storageRef);
          const text = await blob.text();
          setDocumentContent(text);
          setOriginalContent(text);
          return;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.warn('Storage download error (will try fallbacks):', message);
        }
      }

      // Fallback 2: inline stored content
      if ((entry.fields as Record<string, unknown>)?.documentContent) {
        const content = (entry.fields as Record<string, unknown>).documentContent as string;
        setDocumentContent(content);
        setOriginalContent(content);
        return;
      }

      // Fallback 3: legacy localStorage cache
      const localKey = Object.keys(localStorage).find(key =>
        key.startsWith('document_') &&
        (() => { try { return JSON.parse(localStorage.getItem(key) || '{}').name === defaultFileName; } catch { return false; } })()
      );

      if (localKey) {
        try {
          const fileData = JSON.parse(localStorage.getItem(localKey) || '{}');
          const byteCharacters = atob(String(fileData.data || '').split(',')[1] || '');
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: fileData.type || 'text/plain' });
          const text = await blob.text();
          setDocumentContent(text);
          setOriginalContent(text);
          return;
        } catch (e) {
          console.warn('Failed to parse localStorage document cache:', e);
        }
      }

      // Nothing found; start with empty
      setDocumentContent('');
      setOriginalContent('');
    } catch (error) {
      console.error('Error loading document for editing:', error);
      toast.error('Failed to load document for editing');
    } finally {
      setIsLoading(false);
    }
  }, [entry, fileName, user]);

  const handleClose = useCallback(() => {
    if (hasChanges) {
      const confirmClose = window.confirm("You have unsaved changes. Are you sure you want to close?");
      if (!confirmClose) return;
    }
    onClose();
  }, [hasChanges, onClose]);

  useEffect(() => {
    if (isOpen && entry) {
      loadDocumentForEditing();
    }
  }, [isOpen, entry, loadDocumentForEditing]);

  useEffect(() => {
    const handleNovaClose = () => {
      if (isOpen) {
        handleClose();
      }
    };

    window.addEventListener('nova:close', handleNovaClose);
    return () => window.removeEventListener('nova:close', handleNovaClose);
  }, [isOpen, handleClose]);

  useEffect(() => {
    setHasChanges(documentContent !== originalContent);
  }, [documentContent, originalContent]);

  const handleSave = async () => {
    if (!hasChanges || !entry) {
      toast.info('No changes to save');
      return;
    }

    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    try {
      setIsSaving(true);

      // Determine MIME type
      const mime = isHtml ? 'text/html' : (fileType || 'text/plain');

      // Create updated file blob
      const updatedBlob = new Blob([documentContent], { type: mime });

      const existingStoragePath = (entry.fields as Record<string, unknown>)?.storagePath as string | undefined;
      const safeFileName = fileName || (isHtml ? 'document.html' : 'document.txt');
      const filePath = existingStoragePath || `documents/${user.uid}/${entry.id}/${safeFileName}`;

      // Upload to Firebase Storage
      const storageRef = ref(storage, filePath);
      await uploadBytes(storageRef, updatedBlob, {
        contentType: mime
      });

      // Update the entry in the database
      const updatedFields = {
        ...entry.fields,
        documentContent: documentContent, // Store content for quick access
        storagePath: filePath, // Persist the storage path for faster future loads
        updatedAt: new Date().toISOString(),
      } as Record<string, unknown>;

      const entryRef = doc(db, 'entries', entry.id);
      await updateDoc(entryRef, {
        fields: updatedFields,
        updated_at: new Date().toISOString(),
      });

      // Update local state
      setOriginalContent(documentContent);
      setHasChanges(false);

      // Notify parent component
      if (onSave) {
        const updatedEntry: SavedEntry = {
          ...entry,
          fields: updatedFields,
          updatedAt: new Date(),
        };
        onSave(updatedEntry);
      }

      toast.success('Document saved successfully!');
    } catch (error) {
      console.error('Error saving document:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to save document: ${message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const textToHtml = (text: string) => {
    const esc = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const withBreaks = esc.split('\n').join('<br>');
    return `<pre>${withBreaks}</pre>`;
  };

  const handlePrint = async () => {
    try {
      const title = entry?.title || fileName || 'Document';
      const body = isHtml ? documentContent : textToHtml(documentContent);
      const { printDocumentHtml } = await import('@/utils/printUtils');
      printDocumentHtml(title, body);
      toast.success('Opening print dialog...');
    } catch (e) {
      console.error('Error printing document:', e);
      toast.error('Failed to open print dialog');
    }
  };
  if (!isTextBased) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Cannot Edit Document</span>
            </DialogTitle>
            <DialogDescription>Only text-based files (TXT, HTML) can be edited in-browser.</DialogDescription>
          </DialogHeader>
          <div className="text-center py-6">
            <Edit3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              This document type cannot be edited in the browser. 
              Only text-based files (TXT, HTML) can be edited.
            </p>
          </div>
          <div className="flex justify-end">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Edit3 className="w-5 h-5" />
              <span>Editing: {entry?.title || 'Document'}</span>
              {hasChanges && <span className="text-sm text-orange-500">(unsaved changes)</span>}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={handlePrint}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print</span>
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                size="sm"
                className="flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save'}</span>
              </Button>
            </div>
          </DialogTitle>
          <DialogDescription>Edit your text document</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* File Information */}
          <div className="flex-shrink-0 bg-muted/50 p-3 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span><strong>File:</strong> {fileName}</span>
              <span><strong>Type:</strong> {fileType || 'text/plain'}</span>
              <span><strong>Last modified:</strong> {entry?.updatedAt ? entry.updatedAt.toLocaleDateString() : ''}</span>
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1 overflow-hidden border border-border rounded-lg">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2 text-muted-foreground">Loading document...</span>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                {isHtml ? (
                  <div className="flex-1 p-4">
                    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading editor…</div>}>
                      <RichTextEditor
                        content={documentContent}
                        onContentChange={setDocumentContent}
                        placeholder="Start editing your HTML document..."
                      />
                    </Suspense>
                  </div>
                ) : (
                  <Textarea
                    value={documentContent}
                    onChange={(e) => setDocumentContent(e.target.value)}
                    placeholder="Start editing your document..."
                    className="flex-1 resize-none border-0 rounded-none focus:ring-0 font-mono text-sm"
                    style={{ minHeight: '400px' }}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex-shrink-0 flex justify-between pt-4">
          <div className="text-sm text-muted-foreground">
            {documentContent.length} characters
          </div>
          <div className="flex space-x-2">
            <Button onClick={handleClose} variant="outline">
              <X className="w-4 h-4 mr-2" />
              {hasChanges ? 'Cancel' : 'Close'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};