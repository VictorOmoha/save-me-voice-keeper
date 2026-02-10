
import { useState } from "react";
import { toast } from "sonner";
import { SavedEntry } from "@/types/dashboard";
import { logError } from "@/utils/logger";

export const useDownload = () => {
  const [downloadingFiles, setDownloadingFiles] = useState<string[]>([]);

  const handleDownload = async (entry: SavedEntry) => {
    if (!entry.fields.hasUploadedFile || !entry.fields.fileName) {
      toast.error("No file available for download");
      return;
    }

    setDownloadingFiles(prev => [...prev, entry.id]);
    
    try {
      // Search for the file data in localStorage
      const allKeys = Object.keys(localStorage);
      const documentKeys = allKeys.filter(key => key.startsWith('document_'));
      
      let fileData = null;
      for (const key of documentKeys) {
        try {
          const storedData = JSON.parse(localStorage.getItem(key) || '');
          if (storedData.name === entry.fields.fileName) {
            fileData = storedData;
            break;
          }
        } catch (e) {
          continue;
        }
      }

      if (!fileData) {
        toast.error("File data not found in storage");
        return;
      }

      // Create download link
      const link = document.createElement('a');
      link.href = fileData.data;
      link.download = fileData.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Downloaded ${fileData.name}`);
    } catch (error) {
      logError('Download error:', error);
      toast.error("Failed to download file");
    } finally {
      setDownloadingFiles(prev => prev.filter(id => id !== entry.id));
    }
  };

  return { downloadingFiles, handleDownload };
};
