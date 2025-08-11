
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const sb: any = supabase as any;

const precheckFileQuota = async (size: number): Promise<boolean> => {
  try {
    // can_add_usage may not be in generated types; use untyped supabase handle
    const { data, error } = await sb.rpc('can_add_usage', { _delta_db: 0, _delta_file: size });
    if (error) {
      console.warn('can_add_usage RPC error:', error);
      return true; // Allow attempt; server triggers will enforce
    }
    return Boolean(data);
  } catch (e) {
    console.warn('can_add_usage RPC failed:', e);
    return true; // Allow attempt; server triggers will enforce
  }
};

const registerFile = async (userId: string, entryId: string | null, path: string, size: number) => {
  // Ensure we don't double-count if the same path already exists
  await sb.from('user_files').delete().eq('path', path);

  const { error } = await sb.from('user_files').insert({
    user_id: userId,
    entry_id: entryId || null,
    path,
    size,
  } as any);

  if (error) {
    // If this fails due to storage limit, surface a clear message
    const exceeded = error.message?.includes('storage_limit_exceeded') || error.details?.includes?.('storage_limit_exceeded');
    if (exceeded) {
      toast.error('Storage limit reached for your plan. Please delete some files or upgrade your plan.');
    } else {
      console.error('Failed to register file in user_files:', error);
      toast.error('Failed to record file metadata.');
    }
    // Best effort: remove uploaded blob if DB insert fails
    await supabase.storage.from('documents').remove([path]);
    throw error;
  }
};

const unregisterFile = async (path: string) => {
  const { error } = await sb.from('user_files').delete().eq('path', path);
  if (error) {
    console.error('Failed to unregister file from user_files:', error);
  }
};

export const uploadDocumentToStorage = async (
  file: File, 
  entryId: string
): Promise<string | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Pre-check quota before uploading large blobs
    const allowed = await precheckFileQuota(file.size);
    if (!allowed) {
      toast.error('You have reached your storage limit. Please free up space or upgrade your plan.');
      return null;
    }

    const filePath = `${user.id}/${entryId}/${file.name}`;

    // Upload to Supabase Storage
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

    // Register in user_files so usage is tracked accurately
    await registerFile(user.id, entryId, filePath, file.size);

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
    // Remove from storage first
    const { error } = await supabase.storage
      .from('documents')
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    // Then unregister so usage decrements
    await unregisterFile(filePath);

    return true;
  } catch (error) {
    console.error('Error deleting document:', error);
    return false;
  }
};
