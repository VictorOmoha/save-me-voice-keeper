
import React, { memo, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SavedEntry, FieldValue } from "@/types/dashboard";
import { ExportButton } from "@/components/export/ExportButton";
import { ImageGallery } from "@/components/forms/ImageGallery";

// Helper function to extract images from an entry
const getEntryImages = (entry: SavedEntry): string[] => {
  const images: string[] = [];

  // Extract images from field definitions and values
  if (entry.fieldDefinitions) {
    entry.fieldDefinitions.forEach(fieldDef => {
      const fieldValue = entry.fields[fieldDef.name];
      if (fieldDef.type === 'image' && typeof fieldValue === 'string') {
        images.push(fieldValue);
      } else if (fieldDef.type === 'gallery' && Array.isArray(fieldValue)) {
        fieldValue.forEach(item => {
          if (typeof item === 'string') images.push(item);
          else if (item && typeof item === 'object' && 'url' in item) images.push(item.url);
        });
      }
    });
  }

  // Also check for any image URLs in regular fields
  Object.values(entry.fields).forEach(value => {
    if (typeof value === 'string' && (value.includes('/images/') || value.startsWith('http'))) {
      if (value.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
        images.push(value);
      }
    } else if (Array.isArray(value)) {
      value.forEach(item => {
        if (typeof item === 'string' && (item.includes('/images/') || item.startsWith('http'))) {
          if (item.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
            images.push(item);
          }
        }
      });
    }
  });

  return [...new Set(images)]; // Remove duplicates
};

// Memoized individual entry card component
interface EntryCardProps {
  entry: SavedEntry;
  entryImages: string[];
  onDelete: (id: string) => void;
  onEdit: (entry: SavedEntry) => void;
  onFill: (entry: SavedEntry) => void;
}

const EntryCard = memo<EntryCardProps>(({ entry, entryImages, onDelete, onEdit, onFill }) => {
  const handleDelete = useCallback(() => onDelete(entry.id), [onDelete, entry.id]);
  const handleEdit = useCallback(() => onEdit(entry), [onEdit, entry]);
  const handleFill = useCallback(() => onFill(entry), [onFill, entry]);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl">{entry.title}</CardTitle>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            {new Date(entry.createdAt).toLocaleDateString()}
          </Badge>
          <Button
            onClick={handleFill}
            variant="outline"
            size="sm"
            className="text-green-600 hover:text-green-700"
          >
            Fill Form
          </Button>
          <Button
            onClick={handleEdit}
            variant="outline"
            size="sm"
            className="text-blue-600 hover:text-blue-700"
          >
            Edit
          </Button>
          <Button
            onClick={handleDelete}
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700"
          >
            Delete
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Show image thumbnails if any */}
        {entryImages.length > 0 && (
          <div className="mb-4">
            <ImageGallery images={entryImages} readOnly={true} />
          </div>
        )}

        <div className="grid gap-3">
          {Object.entries(entry.fields).map(([key, value]) => {
            // Skip displaying image fields as they're shown in the gallery above
            const valueStr = typeof value === 'string' ? value : '';
            if (entryImages.includes(valueStr) || (Array.isArray(value) && value.some(v => typeof v === 'string' && entryImages.includes(v)))) {
              return null;
            }

            return (
              <div key={key} className="flex flex-col sm:flex-row sm:items-center">
                <span className="font-medium text-gray-700 mb-1 sm:mb-0 sm:w-1/3">
                  {key}:
                </span>
                <span className="text-gray-900 sm:w-2/3">
                  {Array.isArray(value) ? value.join(', ') : String(value)}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.entry.id === nextProps.entry.id &&
    prevProps.entry.updatedAt === nextProps.entry.updatedAt &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.onEdit === nextProps.onEdit &&
    prevProps.onFill === nextProps.onFill
  );
});

EntryCard.displayName = 'EntryCard';

interface SavedEntriesListProps {
  entries: SavedEntry[];
  onDelete: (id: string) => void;
  onEdit: (entry: SavedEntry) => void;
  onFill: (entry: SavedEntry) => void;
}

const SavedEntriesListComponent: React.FC<SavedEntriesListProps> = ({
  entries,
  onDelete,
  onEdit,
  onFill
}) => {
  // Memoize the images computation for each entry
  const entriesWithImages = useMemo(() => {
    return entries.map(entry => ({
      entry,
      images: getEntryImages(entry)
    }));
  }, [entries]);

  const handleDelete = useCallback((id: string) => onDelete(id), [onDelete]);
  const handleEdit = useCallback((entry: SavedEntry) => onEdit(entry), [onEdit]);
  const handleFill = useCallback((entry: SavedEntry) => onFill(entry), [onFill]);
  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold mb-2">No entries yet</h3>
          <p className="text-gray-600">
            Start by adding your first entry using the form above or voice input!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Saved Information</h2>
        <ExportButton
          entries={entries}
          variant="outline"
          size="sm"
        />
      </div>

      <div className="grid gap-4">
        {entriesWithImages.map(({ entry, images }) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            entryImages={images}
            onDelete={handleDelete}
            onEdit={handleEdit}
            onFill={handleFill}
          />
        ))}
      </div>
    </div>
  );
};

// Export memoized component
export const SavedEntriesList = memo(SavedEntriesListComponent);
