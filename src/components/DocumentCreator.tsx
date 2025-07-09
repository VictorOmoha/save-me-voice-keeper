
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SavedEntry } from "@/types/dashboard";
import { FileText, Upload, X, Download, Plus } from "lucide-react";
import { toast } from "sonner";

interface DocumentCreatorProps {
  onSave: (entry: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export const DocumentCreator: React.FC<DocumentCreatorProps> = ({ onSave, onCancel }) => {
  const [documentName, setDocumentName] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [location, setLocation] = useState("");
  const [dateCreated, setDateCreated] = useState("");
  const [notes, setNotes] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [documentContent, setDocumentContent] = useState("");
  const [createMode, setCreateMode] = useState<'upload' | 'create' | 'info'>('info');

  const documentTypes = [
    "ID Document",
    "Insurance Policy",
    "Medical Record",
    "Legal Document",
    "Financial Statement",
    "Contract",
    "Certificate",
    "Receipt",
    "Invoice",
    "Word Document",
    "PDF Document",
    "Other"
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      
      setUploadedFile(file);
      setDocumentName(file.name);
      setDocumentType(file.type.includes('pdf') ? 'PDF Document' : 
                     file.type.includes('word') || file.name.endsWith('.docx') ? 'Word Document' : 
                     'Other');
      toast.success(`File "${file.name}" selected for upload`);
    }
  };

  const createWordDocument = () => {
    console.log('DIAGNOSTIC: Create Word Document button clicked');
    console.log('DIAGNOSTIC: Current documentContent:', documentContent);
    console.log('DIAGNOSTIC: Current documentName:', documentName);
    
    if (!documentContent.trim()) {
      toast.error("Please add some content to create the document");
      console.log('DIAGNOSTIC: No content provided for Word document');
      return;
    }

    // Create a simple Word document structure
    const wordContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="utf-8">
          <title>${documentName || 'Document'}</title>
        </head>
        <body>
          <div style="font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.5;">
            ${documentContent.replace(/\n/g, '<br>')}
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([wordContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const fileName = `${documentName || 'document'}.doc`;
    
    // Create a pseudo-file for storage
    const pseudoFile = new File([blob], fileName, { type: blob.type });
    setUploadedFile(pseudoFile);
    
    console.log('DIAGNOSTIC: Word document created successfully:', {
      fileName,
      fileSize: pseudoFile.size,
      hasFile: !!pseudoFile
    });
    
    toast.success("Word document created successfully! Now click 'Save Document' to save it.");
  };

  const downloadDocument = () => {
    if (!uploadedFile) return;
    
    const url = URL.createObjectURL(uploadedFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = uploadedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Document downloaded!");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('DIAGNOSTIC: DocumentCreator handleSubmit called with data:', {
      documentName,
      documentType,
      description,
      tags,
      location,
      dateCreated,
      notes,
      hasUploadedFile: !!uploadedFile,
      fileName: uploadedFile?.name,
      documentContent: documentContent?.substring(0, 50) + '...'
    });

    // Validation - require at least a document name
    if (!documentName.trim()) {
      toast.error("Please enter a document name");
      console.log('DIAGNOSTIC: Validation failed - no document name');
      return;
    }
    
    const documentEntry = {
      title: documentName.trim(),
      fields: {
        category: 'Documents',
        documentType: documentType || 'Other',
        description: description.trim(),
        tags: tags.trim(),
        location: location.trim(),
        dateCreated: dateCreated,
        notes: notes.trim(),
        fileName: uploadedFile?.name || '',
        fileSize: uploadedFile?.size || 0,
        fileType: uploadedFile?.type || '',
        hasUploadedFile: !!uploadedFile,
        documentContent: documentContent.trim()
      },
      fieldDefinitions: [
        { id: '1', name: 'category', type: 'text' as const },
        { id: '2', name: 'documentType', type: 'text' as const },
        { id: '3', name: 'description', type: 'textarea' as const },
        { id: '4', name: 'tags', type: 'text' as const },
        { id: '5', name: 'location', type: 'text' as const },
        { id: '6', name: 'dateCreated', type: 'date' as const },
        { id: '7', name: 'notes', type: 'textarea' as const },
        { id: '8', name: 'fileName', type: 'text' as const },
        { id: '9', name: 'fileSize', type: 'number' as const },
        { id: '10', name: 'fileType', type: 'text' as const },
        { id: '11', name: 'hasUploadedFile', type: 'text' as const },
        { id: '12', name: 'documentContent', type: 'textarea' as const }
      ]
    };

    console.log('DIAGNOSTIC: Calling onSave with documentEntry:', {
      title: documentEntry.title,
      category: documentEntry.fields.category,
      fieldsCount: Object.keys(documentEntry.fields).length,
      allFieldKeys: Object.keys(documentEntry.fields)
    });

    // Store file data in localStorage if file exists
    if (uploadedFile) {
      console.log('DIAGNOSTIC: Processing file upload...');
      const reader = new FileReader();
      reader.onload = () => {
        const fileData = {
          name: uploadedFile.name,
          type: uploadedFile.type,
          size: uploadedFile.size,
          data: reader.result
        };
        localStorage.setItem(`document_${Date.now()}`, JSON.stringify(fileData));
        console.log('DIAGNOSTIC: File data stored, calling onSave...');
        onSave(documentEntry);
      };
      reader.readAsDataURL(uploadedFile);
    } else {
      console.log('DIAGNOSTIC: No file to upload, calling onSave directly...');
      onSave(documentEntry);
    }
  };

  return (
    <div className="space-y-6 bg-background text-foreground">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Create Document</h2>
          <p className="text-muted-foreground">Save, create, or upload document information</p>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="flex space-x-2 mb-6">
        <Button
          type="button"
          variant={createMode === 'info' ? 'default' : 'outline'}
          onClick={() => setCreateMode('info')}
          className="flex items-center space-x-2"
        >
          <FileText className="w-4 h-4" />
          <span>Document Info</span>
        </Button>
        <Button
          type="button"
          variant={createMode === 'upload' ? 'default' : 'outline'}
          onClick={() => setCreateMode('upload')}
          className="flex items-center space-x-2"
        >
          <Upload className="w-4 h-4" />
          <span>Upload File</span>
        </Button>
        <Button
          type="button"
          variant={createMode === 'create' ? 'default' : 'outline'}
          onClick={() => setCreateMode('create')}
          className="flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create Word Doc</span>
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* File Upload Section */}
        {createMode === 'upload' && (
          <div className="space-y-4 p-4 border border-border rounded-lg bg-card">
            <Label htmlFor="fileUpload" className="text-foreground">Upload Document</Label>
            <div className="flex items-center space-x-4">
              <Input
                id="fileUpload"
                type="file"
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                className="bg-background border-border text-foreground"
              />
              {uploadedFile && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(1)} KB)
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={downloadDocument}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Word Document Creation Section */}
        {createMode === 'create' && (
          <div className="space-y-4 p-4 border border-border rounded-lg bg-card">
            <Label htmlFor="documentContent" className="text-foreground">Document Content</Label>
            <Textarea
              id="documentContent"
              placeholder="Enter the content for your Word document..."
              value={documentContent}
              onChange={(e) => setDocumentContent(e.target.value)}
              className="bg-background border-border text-foreground placeholder:text-muted-foreground min-h-[200px]"
            />
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                After creating the document, scroll down and click "Save Document" to save it to your Documents.
              </div>
              <Button
                type="button"
                onClick={createWordDocument}
                variant="outline"
                className="flex items-center space-x-2"
              >
                <FileText className="w-4 h-4" />
                <span>Create Word Document</span>
              </Button>
            </div>
            {uploadedFile && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center space-x-2 text-green-700 dark:text-green-300">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm font-medium">Document created: {uploadedFile.name}</span>
                </div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Now fill in the document details below and click "Save Document" to save it.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Document Information Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="documentName" className="text-foreground">Document Name *</Label>
            <Input
              id="documentName"
              placeholder="e.g., Driver's License, Insurance Policy"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              className="bg-background border-border text-foreground placeholder:text-muted-foreground"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="documentType" className="text-foreground">Document Type</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                {documentTypes.map((type) => (
                  <SelectItem key={type} value={type} className="text-foreground hover:bg-accent">
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description" className="text-foreground">Description</Label>
          <Textarea
            id="description"
            placeholder="Brief description of the document"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-background border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="tags" className="text-foreground">Tags</Label>
            <Input
              id="tags"
              placeholder="e.g., important, renewal, medical"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="bg-background border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location" className="text-foreground">Location/Storage</Label>
            <Input
              id="location"
              placeholder="e.g., Safe, Folder, Cloud Drive"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="bg-background border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateCreated" className="text-foreground">Date Created/Issued</Label>
          <Input
            id="dateCreated"
            type="date"
            value={dateCreated}
            onChange={(e) => setDateCreated(e.target.value)}
            className="bg-background border-border text-foreground"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes" className="text-foreground">Additional Notes</Label>
          <Textarea
            id="notes"
            placeholder="Any additional information about this document"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="bg-background border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" onClick={onCancel} variant="outline">
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button type="submit" className="bg-gradient-primary hover:opacity-90 text-primary-foreground">
            <FileText className="w-4 h-4 mr-2" />
            Save Document
          </Button>
        </div>
      </form>
    </div>
  );
};
