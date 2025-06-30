
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SavedEntry } from "@/pages/Dashboard";
import { FileText, Upload, X } from "lucide-react";

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
    "Other"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const documentEntry = {
      title: documentName || 'Untitled Document',
      fields: {
        category: 'Documents',
        documentType: documentType,
        description: description,
        tags: tags,
        location: location,
        dateCreated: dateCreated,
        notes: notes
      },
      fieldDefinitions: [
        { id: '1', name: 'category', type: 'text' as const },
        { id: '2', name: 'documentType', type: 'text' as const },
        { id: '3', name: 'description', type: 'textarea' as const },
        { id: '4', name: 'tags', type: 'text' as const },
        { id: '5', name: 'location', type: 'text' as const },
        { id: '6', name: 'dateCreated', type: 'date' as const },
        { id: '7', name: 'notes', type: 'textarea' as const }
      ]
    };

    onSave(documentEntry);
  };

  return (
    <div className="space-y-6 bg-background text-foreground">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Create Document</h2>
          <p className="text-muted-foreground">Save important document information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
          <Button type="submit" className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
            <FileText className="w-4 h-4 mr-2" />
            Save Document
          </Button>
        </div>
      </form>
    </div>
  );
};
