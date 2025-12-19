import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  const [downloadingIds, setDownloadingIds] = useState<string[]>([]);

  const downloadFile = useCallback(async (entry: SavedEntry) => {
    if (!entry.fields.hasUploadedFile || !entry.fields.fileName) {
      toast.error("No file available for download");
      return;
    }

    const fileName = entry.fields.fileName as string;
    setDownloadingIds((prev) => [...prev, entry.id]);

    try {
      // First try Supabase Storage
      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;

      if (user) {
        const storagePath = (entry.fields as any)?.storagePath as string | undefined;
        const filePath = storagePath || `${user.id}/${entry.id}/${fileName}`;

        const { data, error } = await supabase.storage
          .from("documents")
          .download(filePath);

        if (!error && data) {
          const url = URL.createObjectURL(data);
          const link = document.createElement("a");
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          toast.success(`Downloaded ${fileName}`);
          return;
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
  }, []);

  const isDownloading = downloadingIds.length > 0;

  return {
    isDownloading,
    downloadingIds,
    downloadFile,
  };
};

export default useFileDownload;
