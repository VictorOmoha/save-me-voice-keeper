import {Button} from '@/components/ui/button';
import {FolderOpen, Plus} from 'lucide-react';
export function EmptyState({categoryName, onCreateEntry}: {categoryName: string; onCreateEntry: () => void}) {
  return <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
    <FolderOpen className="mx-auto mb-4 h-8 w-8 text-primary" />
    <h2 className="text-lg font-semibold">Your {categoryName.toLowerCase()} collection starts here</h2>
    <p className="mx-auto mt-2 mb-6 max-w-sm text-sm text-muted-foreground">Save a note now, or ask Nova to remember something for you.</p>
    <Button onClick={onCreateEntry} className="min-h-11"><Plus className="mr-2 h-4 w-4" />Add your first memory</Button>
  </div>;
}
