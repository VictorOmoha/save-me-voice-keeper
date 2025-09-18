import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Sparkles, ArrowRight, Check, X } from 'lucide-react';
import { SavedEntry } from '@/types/dashboard';
import { restructureBooksEntry, bookStatusOptions, bookFormatOptions, bookGenreOptions } from '@/utils/entryRestructure';
import { toast } from 'sonner';

interface BooksRestructureButtonProps {
  booksEntry: SavedEntry;
  onRestructure: (newEntry: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export const BooksRestructureButton: React.FC<BooksRestructureButtonProps> = ({
  booksEntry,
  onRestructure
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRestructure = async () => {
    setIsProcessing(true);
    
    try {
      const restructuredEntry = restructureBooksEntry(booksEntry);
      onRestructure(restructuredEntry);
      
      toast.success('Books entry restructured successfully!', {
        description: 'Your books now have comprehensive tracking with 20+ fields for better organization.'
      });
      
      setIsOpen(false);
    } catch (error) {
      console.error('Error restructuring books entry:', error);
      toast.error('Failed to restructure books entry');
    } finally {
      setIsProcessing(false);
    }
  };

  const newFeatures = [
    { name: 'Reading Status', description: 'Track To Read, Reading, Finished, DNF' },
    { name: 'Rating System', description: '1-5 star rating system' },
    { name: 'Reading Dates', description: 'Date started and finished tracking' },
    { name: 'Format Types', description: 'Physical, Ebook, Audiobook, PDF support' },
    { name: 'Location Tracking', description: 'Where your books are stored' },
    { name: 'Series Support', description: 'Book series and numbering' },
    { name: 'Genre Categories', description: '20+ predefined genres' },
    { name: 'Notes & Tags', description: 'Personal notes and searchable tags' },
    { name: 'Purchase Tracking', description: 'Price and purchase information' },
    { name: 'Recommendations', description: 'Track who recommended each book' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-300/50 hover:border-blue-500/50 transition-all duration-300">
          <Sparkles className="h-4 w-4 text-blue-500" />
          Upgrade to Comprehensive Books Database
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="h-6 w-6 text-blue-500" />
            Upgrade Your Books Collection
          </DialogTitle>
          <DialogDescription className="text-base">
            Transform your basic books list into a comprehensive database with advanced tracking features.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current vs New Structure */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
                <X className="h-4 w-4" />
                Current Structure (Limited)
              </h3>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                <ul className="space-y-2 text-sm">
                  <li>• Basic title and author only</li>
                  <li>• No reading status tracking</li>
                  <li>• No rating system</li>
                  <li>• Limited organization</li>
                  <li>• No reading progress</li>
                </ul>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold text-green-600 dark:text-green-400 flex items-center gap-2">
                <Check className="h-4 w-4" />
                New Structure (Comprehensive)
              </h3>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <ul className="space-y-2 text-sm">
                  <li>• 20+ detailed fields per book</li>
                  <li>• Reading status & progress tracking</li>
                  <li>• 5-star rating system</li>
                  <li>• Genre categorization</li>
                  <li>• Series & format support</li>
                  <li>• Notes, tags, and recommendations</li>
                </ul>
              </div>
            </div>
          </div>

          {/* New Features Grid */}
          <div>
            <h3 className="font-semibold mb-4 text-lg">New Features You'll Get:</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {newFeatures.map((feature, index) => (
                <div 
                  key={feature.name}
                  className="flex items-start gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200/50 dark:border-blue-800/50"
                >
                  <div className="mt-1">
                    <Check className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{feature.name}</div>
                    <div className="text-xs text-muted-foreground">{feature.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sample Data Preview */}
          <div className="bg-muted/30 p-4 rounded-lg border">
            <h4 className="font-medium mb-2">Preview: Your migrated data will include:</h4>
            <div className="text-sm space-y-1">
              <p>• Your existing book: "<strong>The Believers Authority</strong>" by <strong>Andrew Wommack</strong></p>
              <p>• Plus 2 sample books to demonstrate all features</p>
              <p>• All organized in a searchable, sortable table format</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRestructure}
              disabled={isProcessing}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {isProcessing ? (
                'Restructuring...'
              ) : (
                <>
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Upgrade Books Database
                </>
              )}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border border-yellow-200 dark:border-yellow-800">
            <strong>Note:</strong> This will create a new "Books Database (Restructured)" entry. Your original entry will remain unchanged.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};