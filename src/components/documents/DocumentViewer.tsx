import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, FileText, Eye, X } from 'lucide-react';
import { SavedEntry } from '@/types/dashboard';
import { storage } from '@/lib/firebase';
import { ref, getBlob } from 'firebase/storage';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';
import { logWarn, logError } from '@/utils/logger';

interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  entry: SavedEntry | null;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  isOpen,
  onClose,
  entry
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [documentContent, setDocumentContent] = useState<string | null>(null);

  if (!entry) return null;

  const isDocumentEntry = entry.fields.category === 'Documents' && entry.fields.hasUploadedFile;
  const fileName = entry.fields.fileName || '';
  const fileType = entry.fields.fileType || '';
  const fileSize = entry.fields.fileSize || 0;
  const storedContent = entry.fields.documentContent || '';

  const isTextBased = fileType.includes('text') || fileType.includes('html') || fileName.endsWith('.txt') || fileName.endsWith('.html');
  const isPdf = fileType.includes('pdf') || fileName.endsWith('.pdf');
  const isWordDoc = fileType.includes('word') || fileName.endsWith('.docx') || fileName.endsWith('.doc');

  const handleDownload = async () => {
    if (!isDocumentEntry) return;

    try {
      setIsLoading(true);

      // First try to get from Firebase Storage
      if (user) {
        const storagePath = (entry.fields as any)?.storagePath as string | undefined;
        const filePath = storagePath || `documents/${user.uid}/${entry.id}/${fileName}`;

        try {
          const storageRef = ref(storage, filePath);
          const blob = await getBlob(storageRef);

          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.success('Document downloaded!');
          return;
        } catch (storageError) {
          logWarn('Firebase storage download failed, trying fallbacks:', storageError);
        }
      }

      // Fallback to localStorage (for legacy documents)
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

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('Document downloaded!');
      } else {
        toast.error('Document file not found');
      }
    } catch (error) {
      logError('Error downloading document:', error);
      toast.error('Failed to download document');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = async () => {
    if (!isTextBased) {
      toast.info('Preview not available for this file type. Please download to view.');
      return;
    }

    try {
      setIsLoading(true);

      // For text-based documents, show the stored content
      if (storedContent) {
        setDocumentContent(storedContent);
      } else if (user) {
        // Try to get from Firebase Storage
        const storagePath = (entry.fields as any)?.storagePath as string | undefined;
        const filePath = storagePath || `documents/${user.uid}/${entry.id}/${fileName}`;

        try {
          const storageRef = ref(storage, filePath);
          const blob = await getBlob(storageRef);
          const text = await blob.text();
          setDocumentContent(text);
        } catch (storageError) {
          logWarn('Firebase storage preview failed:', storageError);
          setDocumentContent('No content available for preview.');
        }
      } else {
        setDocumentContent('No content available for preview.');
      }
    } catch (error) {
      logError('Error previewing document:', error);
      setDocumentContent('Error loading document content.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>{entry.title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Document Information */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Document Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">File Name:</span>
                <p className="text-muted-foreground">{fileName || 'Not specified'}</p>
              </div>
              <div>
                <span className="font-medium">File Type:</span>
                <p className="text-muted-foreground">{entry.fields.documentType || 'Unknown'}</p>
              </div>
              <div>
                <span className="font-medium">File Size:</span>
                <p className="text-muted-foreground">{formatFileSize(fileSize)}</p>
              </div>
              <div>
                <span className="font-medium">Created:</span>
                <p className="text-muted-foreground">{entry.createdAt.toLocaleDateString()}</p>
              </div>
            </div>

            {entry.fields.description && (
              <div className="mt-4">
                <span className="font-medium">Description:</span>
                <p className="text-muted-foreground mt-1">{entry.fields.description}</p>
              </div>
            )}

            {entry.fields.tags && (
              <div className="mt-4">
                <span className="font-medium">Tags:</span>
                <p className="text-muted-foreground mt-1">{entry.fields.tags}</p>
              </div>
            )}
          </div>

          {/* Document Actions */}
          {isDocumentEntry && (
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleDownload}
                disabled={isLoading}
                className="flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </Button>

              {isTextBased && (
                <Button
                  onClick={handlePreview}
                  variant="outline"
                  disabled={isLoading}
                  className="flex items-center space-x-2"
                >
                  <Eye className="w-4 h-4" />
                  <span>Preview</span>
                </Button>
              )}

              {(isPdf || isWordDoc) && (
                <div className="text-sm text-muted-foreground flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Download to view this document type
                </div>
              )}
            </div>
          )}

          {/* Document Content Preview */}
          {documentContent && (
            <div className="border border-border rounded-lg">
              <div className="bg-muted/50 px-4 py-2 border-b border-border">
                <h4 className="font-medium">Document Preview</h4>
              </div>
              <div className="p-4 max-h-96 overflow-y-auto">
                {fileName.endsWith('.html') ? (
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(documentContent) }}
                  />
                ) : (
                  <pre className="whitespace-pre-wrap text-sm text-foreground font-mono">
                    {documentContent}
                  </pre>
                )}
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-muted-foreground">Loading...</span>
            </div>
          )}

          {/* Additional Notes */}
          {entry.fields.notes && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Additional Notes</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {entry.fields.notes}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose} variant="outline">
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
