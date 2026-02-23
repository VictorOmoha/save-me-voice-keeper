import { useState, useCallback } from "react";
import { storage } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { ref, getBlob } from "firebase/storage";
import { SavedEntry } from "@/types/dashboard";
import { toast } from "sonner";

interface UseFileDownloadReturn {
  isDownloading: boolean;
  downloadingIds: string[];
  downloadFile: (entry: SavedEntry) => Promise<void>;
}

/**
 * Custom hook for handling file downloads from entries
 * Consolidates duplicate download logic from multiple components
 */
export const useFileDownload = (): UseFileDownloadReturn => {
  const { user } = useAuth();
  const [downloadingIds, setDownloadingIds] = useState<string[]>([]);

  const downloadFile = useCallback(async (entry: SavedEntry) => {
    if (!entry.fields.hasUploadedFile || !entry.fields.fileName) {
      toast.error("No file available for download");
      return;
    }

    const fileName = entry.fields.fileName as string;
    setDownloadingIds((prev) => [...prev, entry.id]);

    try {
      // First try Firebase Storage
      if (user) {
        const fields = entry.fields as Record<string, unknown>;
        const storagePath = typeof fields.storagePath === "string" ? fields.storagePath : undefined;
        const filePath = storagePath || `documents/${user.uid}/${entry.id}/${fileName}`;

        try {
          const storageRef = ref(storage, filePath);
          const blob = await getBlob(storageRef);

          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          toast.success(`Downloaded ${fileName}`);
          return;
        } catch (storageError) {
          console.warn('Firebase storage download failed, trying fallbacks:', storageError);
        }
      }

      // Fallback to localStorage for legacy documents
      const allKeys = Object.keys(localStorage);
      const documentKeys = allKeys.filter((key) => key.startsWith("document_"));

      let fileData = null;
      for (const key of documentKeys) {
        try {
          const storedData = JSON.parse(localStorage.getItem(key) || "");
          if (storedData.name === fileName) {
            fileData = storedData;
            break;
          }
        } catch {
          continue;
        }
      }

      if (!fileData) {
        toast.error("File data not found in storage");
        return;
      }

      // Create download link from localStorage data
      const link = document.createElement("a");
      link.href = fileData.data;
      link.download = fileData.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Downloaded ${fileData.name}`);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download file");
    } finally {
      setDownloadingIds((prev) => prev.filter((id) => id !== entry.id));
    }
  }, [user]);

  const isDownloading = downloadingIds.length > 0;

  return {
    isDownloading,
    downloadingIds,
    downloadFile,
  };
};

export default useFileDownload;
