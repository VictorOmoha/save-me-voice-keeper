
import { storage, auth } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject, getBlob } from 'firebase/storage';
import { toast } from 'sonner';

export const uploadDocumentToStorage = async (
  file: File,
  entryId: string
): Promise<string | null> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    const filePath = `documents/${user.uid}/${entryId}/${file.name}`;
    const storageRef = ref(storage, filePath);

    // Upload to Firebase Storage
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        uploadedBy: user.uid,
        entryId: entryId,
        originalName: file.name
      }
    });

    console.log('Document uploaded to storage:', snapshot.ref.fullPath);
    return snapshot.ref.fullPath;
  } catch (error) {
    console.error('Error uploading document:', error);
    toast.error('Failed to upload document to storage');
    return null;
  }
};

export const downloadDocumentBlob = async (filePath: string): Promise<Blob> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      getBlob(ref(storage, filePath)),
      new Promise<never>((_, reject) => {timer = setTimeout(() => reject(new Error('The download timed out. Check your connection and try again.')), 30_000);}),
    ]);
  } finally {clearTimeout(timer);}
};

export const getDocumentFromStorage = async (filePath: string): Promise<Blob | null> => {
  try {
    return await downloadDocumentBlob(filePath);
  } catch (error) {
    console.error('Error downloading document:', error);
    return null;
  }
};

export const getDocumentUrl = async (filePath: string): Promise<string | null> => {
  try {
    const storageRef = ref(storage, filePath);
    const url = await getDownloadURL(storageRef);
    return url;
  } catch (error) {
    console.error('Error getting document URL:', error);
    return null;
  }
};

export const deleteDocumentFromStorage = async (filePath: string): Promise<boolean> => {
  try {
    const storageRef = ref(storage, filePath);
    await deleteObject(storageRef);
    return true;
  } catch (error) {
    console.error('Error deleting document:', error);
    return false;
  }
};
