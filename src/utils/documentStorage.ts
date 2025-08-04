import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const uploadDocumentToStorage = async (
  file: File, 
  entryId: string
): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const filePath = `${user.id}/${entryId}/${file.name}`;
    
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Upload error:', error);
      throw error;
    }

    console.log('Document uploaded to storage:', data.path);
    return data.path;
  } catch (error) {
    console.error('Error uploading document:', error);
    toast.error('Failed to upload document to storage');
    return null;
  }
};

export const getDocumentFromStorage = async (filePath: string): Promise<Blob | null> => {
  try {
    const { data, error } = await supabase.storage
      .from('documents')
      .download(filePath);

    if (error) {
      console.error('Download error:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error downloading document:', error);
    return null;
  }
};

export const deleteDocumentFromStorage = async (filePath: string): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from('documents')
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting document:', error);
    return false;
  }
};