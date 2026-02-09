
import { storage } from "@/lib/firebase";
import { ref, deleteObject } from "firebase/storage";

export const deleteImageFromStorage = async (imageUrl: string): Promise<boolean> => {
  try {
    // Extract file path from Firebase Storage URL
    // Firebase URLs contain the path after /o/ and before ?
    const urlMatch = imageUrl.match(/\/o\/(.+?)\?/);
    if (!urlMatch) return false;

    const filePath = decodeURIComponent(urlMatch[1]);
    const storageRef = ref(storage, filePath);

    await deleteObject(storageRef);
    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
};

export const getImageMetadata = async (file: File): Promise<{
  width: number;
  height: number;
  size: number;
  type: string;
}> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        size: file.size,
        type: file.type
      });
    };
    img.src = URL.createObjectURL(file);
  });
};

export const isImageUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;

  return (
    url.includes('/images/') ||
    url.includes('firebasestorage.googleapis.com') ||
    url.match(/\.(jpeg|jpg|gif|png|webp)$/i) !== null ||
    url.startsWith('data:image/')
  );
};

export const extractImagesFromEntry = (entry: any): string[] => {
  const images: string[] = [];

  // Extract from field definitions
  if (entry.fieldDefinitions) {
    entry.fieldDefinitions.forEach((fieldDef: any) => {
      const fieldValue = entry.fields[fieldDef.name];
      if (fieldDef.type === 'image' && isImageUrl(fieldValue)) {
        images.push(fieldValue);
      } else if (fieldDef.type === 'gallery' && Array.isArray(fieldValue)) {
        fieldValue.forEach(url => {
          if (isImageUrl(url)) {
            images.push(url);
          }
        });
      }
    });
  }

  // Extract from regular fields
  Object.values(entry.fields).forEach(value => {
    if (isImageUrl(value as string)) {
      images.push(value as string);
    } else if (Array.isArray(value)) {
      value.forEach(item => {
        if (isImageUrl(item)) {
          images.push(item);
        }
      });
    }
  });

  return [...new Set(images)]; // Remove duplicates
};
