
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import { logError } from "@/utils/logger";

interface ImageGalleryProps {
  images: string[];
  readOnly?: boolean;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ 
  images, 
  readOnly = false 
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  if (!images || images.length === 0) {
    return null;
  }

  const nextImage = () => {
    setSelectedIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const downloadImage = async (url: string, index: number) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `image-${index + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      logError('Error downloading image:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Thumbnail Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((url, index) => (
          <Dialog key={index} open={isOpen && selectedIndex === index} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <div 
                className="relative group cursor-pointer"
                onClick={() => {
                  setSelectedIndex(index);
                  setIsOpen(true);
                }}
              >
                <img
                  src={url}
                  alt={`Image ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border border-border hover:border-primary transition-colors"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-sm font-medium">View</span>
                  </div>
                </div>
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-4xl w-full p-0">
              <div className="relative">
                <img
                  src={images[selectedIndex]}
                  alt={`Image ${selectedIndex + 1}`}
                  className="w-full h-auto max-h-[80vh] object-contain"
                />
                
                {/* Navigation Controls */}
                {images.length > 1 && (
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute left-4 top-1/2 transform -translate-y-1/2"
                      onClick={prevImage}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute right-4 top-1/2 transform -translate-y-1/2"
                      onClick={nextImage}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </>
                )}
                
                {/* Top Controls */}
                <div className="absolute top-4 right-4 flex space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => downloadImage(images[selectedIndex], selectedIndex)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Image Counter */}
                {images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                      {selectedIndex + 1} of {images.length}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        ))}
      </div>
    </div>
  );
};
