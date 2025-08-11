import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save, X, FileText, Edit3 } from 'lucide-react';
import { SavedEntry } from '@/types/dashboard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RichTextEditor } from './RichTextEditor';

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
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [documentContent, setDocumentContent] = useState<string>('');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [hasChanges, setHasChanges] = useState(false);

  

  const fileName = entry?.fields?.fileName || '';
  const fileType = entry?.fields?.fileType || '';
  const hasInline = Boolean((entry?.fields as any)?.documentContent);
  const isTextBased = hasInline || fileType.includes('text') || fileType.includes('html') || fileName.endsWith('.txt') || fileName.endsWith('.html');
  const isHtml = fileName.endsWith('.html') || fileType.includes('html');

  useEffect(() => {
    if (isOpen && entry) {
      loadDocumentForEditing();
    }
  }, [isOpen, entry]);

  useEffect(() => {
    setHasChanges(documentContent !== originalContent);
  }, [documentContent, originalContent]);

  const loadDocumentForEditing = async () => {
    try {
      setIsLoading(true);
      
      // First try stored content
      if (entry.fields.documentContent) {
        const content = entry.fields.documentContent;
        setDocumentContent(content);
        setOriginalContent(content);
        return;
      }

      // Try to get from Supabase Storage (prefer explicit storagePath)
      const storagePath = (entry.fields as any)?.storagePath as string | undefined;
      const filePath = storagePath || `${entry.id}/${fileName}`;
      const { data } = await supabase.storage
        .from('documents')
        .download(filePath);

      if (data) {
        const text = await data.text();
        setDocumentContent(text);
        setOriginalContent(text);
      } else {
        // Fallback to localStorage
        const localKey = Object.keys(localStorage).find(key => 
          key.startsWith('document_') && 
          JSON.parse(localStorage.getItem(key) || '{}').name === fileName
        );

        if (localKey) {
          const fileData = JSON.parse(localStorage.getItem(localKey) || '{}');
          const byteCharacters = atob(fileData.data.split(',')[1]);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: fileData.type });
          const text = await blob.text();
          setDocumentContent(text);
          setOriginalContent(text);
        }
      }
    } catch (error) {
      console.error('Error loading document for editing:', error);
      toast.error('Failed to load document for editing');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!hasChanges) {
      toast.info('No changes to save');
      return;
    }

    try {
      setIsSaving(true);

      // Create updated file blob
      const updatedBlob = new Blob([documentContent], { type: fileType || 'text/plain' });
      
      // Upload to Supabase Storage (prefer existing storagePath)
      const existingStoragePath = (entry.fields as any)?.storagePath as string | undefined;
      const filePath = existingStoragePath || `${entry.id}/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, updatedBlob, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Update the entry in the database
      const updatedFields = {
        ...entry.fields,
        documentContent: documentContent, // Store content for quick access
        storagePath: filePath, // Persist the storage path for faster future loads
        updatedAt: new Date().toISOString()
      };

      const { error: updateError } = await supabase
        .from('entries')
        .update({
          fields: updatedFields,
          updated_at: new Date().toISOString()
        })
        .eq('id', entry.id);

      if (updateError) {
        console.error('Database update error:', updateError);
        throw updateError;
      }

      // Update local state
      setOriginalContent(documentContent);
      setHasChanges(false);

      // Notify parent component
      if (onSave) {
        const updatedEntry: SavedEntry = {
          ...entry,
          fields: updatedFields,
          updatedAt: new Date()
        };
        onSave(updatedEntry);
      }

      toast.success('Document saved successfully!');
    } catch (error) {
      console.error('Error saving document:', error);
      toast.error('Failed to save document');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      const confirmClose = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmClose) return;
    }
    onClose();
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
                    <RichTextEditor
                      content={documentContent}
                      onContentChange={setDocumentContent}
                      placeholder="Start editing your HTML document..."
                    />
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