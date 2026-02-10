
import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { storage } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from "sonner";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { logError } from "@/utils/logger";

interface ImageUploadProps {
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
  label: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  multiple = false,
  label
}) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length > 0) {
      handleFiles(imageFiles);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;

    if (!user) {
      toast.error("You must be logged in to upload images");
      return;
    }

    setUploading(true);

    try {
      const uploadPromises = files.map(async (file) => {
        // Compress image if needed
        const compressedFile = await compressImage(file);

        const fileExt = compressedFile.name.split('.').pop();
        const fileName = `images/${user.uid}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const storageRef = ref(storage, fileName);
        const snapshot = await uploadBytes(storageRef, compressedFile, {
          contentType: compressedFile.type
        });

        const publicUrl = await getDownloadURL(snapshot.ref);
        return publicUrl;
      });

      const urls = await Promise.all(uploadPromises);

      if (multiple) {
        const currentUrls = Array.isArray(value) ? value : [];
        onChange([...currentUrls, ...urls]);
      } else {
        onChange(urls[0]);
      }

      toast.success(`${urls.length} image(s) uploaded successfully!`);
    } catch (error) {
      logError('Error uploading images:', error);
      toast.error("Failed to upload images");
    } finally {
      setUploading(false);
    }
  };

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        const maxWidth = 1920;
        const maxHeight = 1080;
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        ctx?.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(img.src);

        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', 0.8);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const removeImage = (indexOrUrl: number | string) => {
    if (multiple && Array.isArray(value)) {
      if (typeof indexOrUrl === 'number') {
        const newUrls = value.filter((_, index) => index !== indexOrUrl);
        onChange(newUrls);
      }
    } else {
      onChange(multiple ? [] : '');
    }
  };

  const currentImages = multiple ? (Array.isArray(value) ? value : []) : (value ? [value as string] : []);

  return (
    <div className="space-y-4">
      {label && <Label className="text-foreground">{label}</Label>}

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-primary bg-primary/10'
            : 'border-border hover:border-primary/50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-2">
          Drag and drop images here, or click to select
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? 'Uploading...' : 'Choose Images'}
        </Button>
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {/* Image Preview Grid */}
      {currentImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {currentImages.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`Upload ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border border-border"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
