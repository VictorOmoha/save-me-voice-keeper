import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Checkbox} from '@/components/ui/checkbox';
import {SavedEntry} from '@/types/dashboard';
import {FileText, Trash2} from 'lucide-react';
import {ExportButton} from '@/components/export/ExportButton';
import {EntryViewDialog} from '@/components/recentEntries/EntryViewDialog';
import {DeleteConfirmDialog} from '@/components/DeleteConfirmDialog';
import {EnhancedEntryCard} from '@/components/entries/EnhancedEntryCard';
import {useDownload} from '@/components/categoryView/useDownload';

interface EntriesTableProps {
  entries: SavedEntry[];
  onDelete: (id: string) => void;
  onEdit: (entry: SavedEntry) => void;
  onFill: (entry: SavedEntry) => void;
  onUseAsTemplate: (entry: SavedEntry) => void;
  onBulkDelete: (ids: string[]) => void;
  onViewDocument?: (entry: SavedEntry) => void;
  searchQuery?: string;
  onClearSearch?: () => void;
}

export function EntriesTable({entries, onDelete, onEdit, onFill, onUseAsTemplate, onBulkDelete, onViewDocument, searchQuery = '', onClearSearch}: EntriesTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sort, setSort] = useState('updated');
  const [viewingEntry, setViewingEntry] = useState<SavedEntry | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<SavedEntry | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const {handleDownload} = useDownload();
  // Bulk operations are always limited to the memories currently visible.
  const selected = entries.filter(entry => selectedIds.includes(entry.id)).map(entry => entry.id);
  const allSelected = entries.length > 0 && selected.length === entries.length;
  const sortedEntries = [...entries].sort((a, b) => sort === 'title' ? a.title.localeCompare(b.title) :
    new Date(sort === 'created' ? b.createdAt : b.updatedAt).getTime() - new Date(sort === 'created' ? a.createdAt : a.updatedAt).getTime());
  const toggleEntry = (id: string) => setSelectedIds(previous => previous.includes(id) ? previous.filter(value => value !== id) : [...previous, id]);

  if (!entries.length) return <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
    <FileText className="mx-auto mb-4 h-8 w-8 text-primary" />
    <h2 className="text-lg font-semibold">{searchQuery ? 'No matching memories' : 'Your memories belong here'}</h2>
    <p className="mt-2 text-sm text-muted-foreground">{searchQuery ? 'Try another word, or clear your search to see everything.' : 'Add your first memory or ask Nova to save something for you.'}</p>
    {searchQuery && <Button variant="outline" className="mt-5" onClick={onClearSearch}>Clear search</Button>}
  </div>;

  return <section aria-label="Saved memories" className="overflow-hidden rounded-2xl border border-border/70 bg-card">
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 p-4 md:p-5">
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <Checkbox aria-label="Select all visible memories" checked={allSelected ? true : selected.length ? 'indeterminate' : false}
          onCheckedChange={() => setSelectedIds(allSelected ? [] : entries.map(entry => entry.id))} />
        {selected.length ? `${selected.length} selected` : `${entries.length} ${entries.length === 1 ? 'memory' : 'memories'}`}
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <select aria-label="Sort memories" className="workspace-select" value={sort} onChange={event => setSort(event.target.value)}>
          <option value="updated">Recently updated</option><option value="created">Newest first</option><option value="title">Title A–Z</option>
        </select>
        <ExportButton entries={entries} selectedEntries={selected} variant="outline" />
        {selected.length > 0 && <Button variant="outline" className="text-destructive min-h-11" onClick={() => setBulkDeleteOpen(true)}>
          <Trash2 className="mr-2 h-4 w-4" />Delete selected
        </Button>}
      </div>
    </div>
    <ul className="divide-y divide-border/60">
      {sortedEntries.map(entry => <li key={entry.id} className="flex items-start gap-2 p-3 sm:gap-3 sm:p-4">
        <label className="flex h-11 w-7 shrink-0 items-center justify-center">
          <Checkbox aria-label={`Select ${entry.title}`} checked={selected.includes(entry.id)} onCheckedChange={() => toggleEntry(entry.id)} />
        </label>
        <EnhancedEntryCard entry={entry} variant="list" className="memory-list-row min-w-0 flex-1"
          onView={setViewingEntry} onEdit={onEdit} onFill={onFill} onUseAsTemplate={onUseAsTemplate}
          onDelete={() => setDeletingEntry(entry)} onDownload={handleDownload} />
      </li>)}
    </ul>
    <EntryViewDialog entry={viewingEntry} isOpen={!!viewingEntry} onClose={() => setViewingEntry(null)} allEntries={entries}
      onEdit={entry => { setViewingEntry(null); onEdit(entry); }} onFill={entry => { setViewingEntry(null); onFill(entry); }}
      onUseAsTemplate={entry => { setViewingEntry(null); onUseAsTemplate(entry); }} onViewDocument={onViewDocument}
      onOpenRelatedEntry={setViewingEntry} />
    <DeleteConfirmDialog isOpen={!!deletingEntry} title={deletingEntry?.title || ''} onClose={() => setDeletingEntry(null)}
      onConfirm={() => { if (deletingEntry) onDelete(deletingEntry.id); }} />
    <DeleteConfirmDialog isOpen={bulkDeleteOpen && selected.length > 0} title="Selected memories" isMultiple count={selected.length}
      onClose={() => setBulkDeleteOpen(false)} onConfirm={() => { onBulkDelete(selected); setSelectedIds([]); }} />
  </section>;
}
