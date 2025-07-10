
import { supabase } from "@/integrations/supabase/client";

export const deleteImageFromStorage = async (imageUrl: string): Promise<boolean> => {
  try {
    // Extract file path from URL
    const urlParts = imageUrl.split('/');
    const bucketIndex = urlParts.findIndex(part => part === 'images');
    
    if (bucketIndex === -1) return false;
    
    const filePath = urlParts.slice(bucketIndex + 1).join('/');
    
    const { error } = await supabase.storage
      .from('images')
      .remove([filePath]);
    
    if (error) {
      console.error('Error deleting image:', error);
      return false;
    }
    
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
