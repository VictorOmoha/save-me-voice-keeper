import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Brain, PlugZap, Plus, RefreshCw, Search, X } from 'lucide-react';
import {
  sharedMemoryClient,
  SharedMemoryCreateInput,
  SharedMemoryRecord,
  SharedMemoryUpdateInput,
} from '@/utils/sharedMemoryClient';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

// ─── helpers ────────────────────────────────────────────────────────────────

function formatRelativeDate(value: unknown): string {
  if (!value) return '';
  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate().toLocaleString();
  }
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
}

const SOURCE_LABELS: Record<string, string> = {
  human: '👤 Human',
  openclaw: '🤖 Nia',
  hermes: '🦎 Hermes',
  claude: '✨ Claude',
  codex: '⌨️ Codex',
  cursor: '🖱️ Cursor',
  gemini: '💎 Gemini',
  custom_agent: '🔌 Agent',
  automation: '⚡ Automation',
  system: '⚙️ System',
  import: '📥 Import',
};

const TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'fact', label: 'Fact' },
  { value: 'decision', label: 'Decision' },
  { value: 'preference', label: 'Preference' },
  { value: 'idea', label: 'Idea' },
  { value: 'task', label: 'Task' },
  { value: 'summary', label: 'Summary' },
  { value: 'project_context', label: 'Project context' },
  { value: 'conversation_memory', label: 'Conversation' },
];

const PROJECT_OPTIONS = [
  { value: '', label: 'All projects' },
  { value: 'save-me', label: 'SaveMe.Space' },
  { value: 'omoha-solutions', label: 'Omoha Solutions' },
  { value: 'cognibrowse', label: 'Cognibrowse' },
  { value: 'provenance', label: 'Provenance' },
  { value: 'zeir-anpin', label: 'Zeir Anpin' },
];

// ─── create/edit form ────────────────────────────────────────────────────────

interface MemoryFormProps {
  initial?: Partial<SharedMemoryRecord>;
  onSave: (data: SharedMemoryCreateInput) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

function MemoryForm({ initial, onSave, onCancel, saving }: MemoryFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [summary, setSummary] = useState(initial?.summary ?? '');
  const [type, setType] = useState(initial?.type ?? 'fact');
  const [project, setProject] = useState(initial?.project ?? '');
  const [tags, setTags] = useState((initial?.tags ?? []).join(', '));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    await onSave({
      title: title.trim(),
      content: content.trim(),
      summary: summary.trim() || undefined,
      type: (type as SharedMemoryCreateInput['type']) || 'fact',
      source: 'human',
      project: project.trim() || undefined,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      visibility: 'shared_with_agents',
      verification: 'human_confirmed',
    });
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Title *</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Short memorable title"
          required
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Content *</label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Full memory content"
          className="min-h-[120px] resize-none"
          required
        />
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Summary</label>
        <Input
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="One-line summary (optional)"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Type</label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.filter((o) => o.value).map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Project</label>
          <Select value={project} onValueChange={setProject}>
            <SelectTrigger>
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value || '_none'}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Tags (comma separated)</label>
        <Input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="e.g. decision, deploy, save-me"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-2 text-sm rounded-lg border hover:bg-muted"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 text-sm rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save memory'}
        </button>
      </div>
    </form>
  );
}

// ─── main panel ─────────────────────────────────────────────────────────────

export function SharedMemoryPanel() {
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterProject, setFilterProject] = useState('');

  const [memories, setMemories] = useState<SharedMemoryRecord[]>([]);
  const [selectedMemory, setSelectedMemory] = useState<SharedMemoryRecord | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingMemory, setEditingMemory] = useState<SharedMemoryRecord | null>(null);

  const loadRecent = useCallback(async () => {
    setLoading(true);
    try {
      const result = await sharedMemoryClient.list({
        limit: 10,
        visibility: ['shared_with_agents'],
        types: filterType ? [filterType] : undefined,
        project: filterProject || undefined,
      } as Parameters<typeof sharedMemoryClient.list>[0]);
      setMemories(result.memories);
    } catch (error) {
      console.error('Failed to load shared memories', error);
      toast.error('Failed to load shared memories');
    } finally {
      setLoading(false);
    }
  }, [filterProject, filterType]);

  useEffect(() => {
    void loadRecent();
  }, [loadRecent]);

  const runSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed) {
      void loadRecent();
      return;
    }

    setSearching(true);
    try {
      const result = await sharedMemoryClient.search({
        query: trimmed,
        limit: 10,
        visibility: ['shared_with_agents'],
        types: filterType ? [filterType] : undefined,
        project: filterProject || undefined,
      } as Parameters<typeof sharedMemoryClient.search>[0]);
      setMemories(result.memories);
    } catch (error) {
      console.error('Failed to search', error);
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleCreate = async (data: SharedMemoryCreateInput) => {
    setSaving(true);
    try {
      await sharedMemoryClient.create(data);
      toast.success('Memory saved');
      setShowCreate(false);
      void loadRecent();
    } catch (error) {
      toast.error('Failed to save memory', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (data: SharedMemoryCreateInput) => {
    if (!editingMemory) return;
    setSaving(true);
    try {
      const patch: SharedMemoryUpdateInput = {
        title: data.title,
        content: data.content,
        summary: data.summary,
        tags: data.tags,
        project: data.project,
        verification: data.verification,
        visibility: data.visibility,
      };
      await sharedMemoryClient.update(editingMemory.id, patch);
      toast.success('Memory updated');
      setEditingMemory(null);
      setSelectedMemory(null);
      void loadRecent();
    } catch (error) {
      toast.error('Failed to update memory', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setSaving(false);
    }
  };

  const subtitle = useMemo(() => {
    if (query.trim()) return `${memories.length} result${memories.length === 1 ? '' : 's'} for "${query.trim()}"`;
    return `${memories.length} recent shared memor${memories.length === 1 ? 'y' : 'ies'}`;
  }, [memories.length, query]);

  const activeFilters = [filterType, filterProject].filter(Boolean).length;

  return (
    <>
      {/* ── Main card ── */}
      <div className="p-6 rounded-xl border bg-card space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Shared Memory</h3>
              <p className="text-sm text-muted-foreground">
                Cross-agent memory — visible to Nova, Nia, Hermes, and external agents.{' '}
                <Link to="/settings?tab=automation&connect=agent" className="text-primary hover:underline">
                  Connect an agent →
                </Link>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/settings?tab=automation&connect=agent"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium hover:bg-muted"
            >
              <PlugZap className="w-4 h-4" />
              Connect agent
            </Link>
            <button
              type="button"
              onClick={() => void loadRecent()}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm hover:bg-muted disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
            >
              <Plus className="w-4 h-4" />
              New
            </button>
          </div>
        </div>

        {/* Search + filters */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void runSearch();
                  }
                }}
                placeholder="Search shared memory"
                className="pl-9"
              />
            </div>
            <button
              type="button"
              onClick={() => void runSearch()}
              disabled={searching}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 text-sm"
            >
              {searching ? 'Searching…' : 'Search'}
            </button>
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap gap-3 items-center">
            <Select value={filterType || '_all'} onValueChange={(v) => setFilterType(v === '_all' ? '' : v)}>
              <SelectTrigger className="w-36 h-8 text-xs">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value || '_all'} value={o.value || '_all'} className="text-xs">{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterProject || '_all'} onValueChange={(v) => setFilterProject(v === '_all' ? '' : v)}>
              <SelectTrigger className="w-40 h-8 text-xs">
                <SelectValue placeholder="Project" />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_OPTIONS.map((o) => (
                  <SelectItem key={o.value || '_all'} value={o.value || '_all'} className="text-xs">{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {activeFilters > 0 && (
              <button
                type="button"
                onClick={() => { setFilterType(''); setFilterProject(''); }}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
                Clear filters
              </button>
            )}
          </div>
        </div>

        <div className="text-xs text-muted-foreground">{loading ? 'Loading…' : subtitle}</div>

        {/* Memory list */}
        <div className="space-y-2">
          {!loading && memories.length === 0 && (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground text-center">
              No shared memories yet. Click <strong>New</strong> to create one.
            </div>
          )}

          {memories.map((memory) => (
            <button
              key={memory.id}
              type="button"
              onClick={() => setSelectedMemory(memory)}
              className="w-full text-left rounded-xl border p-4 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-medium text-foreground truncate">{memory.title}</div>
                  <div className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                    {memory.summary || memory.content}
                  </div>
                </div>
                <span className="shrink-0 text-[11px] px-2 py-1 rounded-md bg-primary/10 text-primary border border-primary/20">
                  {memory.type || 'memory'}
                </span>
              </div>

              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] text-muted-foreground">
                {memory.project && <span>{memory.project}</span>}
                <span>{SOURCE_LABELS[memory.source] || memory.source}</span>
                <span>{memory.verification}</span>
                {memory.tags?.slice(0, 3).map((tag) => (
                  <span key={tag} className="bg-muted rounded px-1">{tag}</span>
                ))}
                <span className="ml-auto">{formatRelativeDate(memory.updated_at || memory.created_at)}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Detail dialog ── */}
      <Dialog open={Boolean(selectedMemory) && !editingMemory} onOpenChange={(open) => !open && setSelectedMemory(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedMemory && (
            <>
              <DialogHeader>
                <DialogTitle className="pr-8">{selectedMemory.title}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {selectedMemory.project && <span>Project: <strong>{selectedMemory.project}</strong></span>}
                  <span>Type: <strong>{selectedMemory.type}</strong></span>
                  <span>Source: <strong>{SOURCE_LABELS[selectedMemory.source] || selectedMemory.source}</strong></span>
                  <span>Verification: <strong>{selectedMemory.verification}</strong></span>
                </div>

                {selectedMemory.summary && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">Summary</div>
                    <p className="text-muted-foreground">{selectedMemory.summary}</p>
                  </div>
                )}

                <div>
                  <div className="text-xs font-medium text-muted-foreground mb-1">Content</div>
                  <p className="whitespace-pre-wrap text-foreground/80">{selectedMemory.content}</p>
                </div>

                {selectedMemory.tags?.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">Tags</div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedMemory.tags.map((tag) => (
                        <span key={tag} className="text-[11px] px-2 py-0.5 rounded-md bg-muted">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedMemory.people?.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">People</div>
                    <p>{selectedMemory.people.join(', ')}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                  <span>Updated: {formatRelativeDate(selectedMemory.updated_at || selectedMemory.created_at)}</span>
                  <button
                    type="button"
                    onClick={() => { setEditingMemory(selectedMemory); setSelectedMemory(null); }}
                    className="px-3 py-1.5 rounded-lg border hover:bg-muted text-xs font-medium"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Create dialog ── */}
      <Dialog open={showCreate} onOpenChange={(open) => !open && setShowCreate(false)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New shared memory</DialogTitle>
          </DialogHeader>
          <MemoryForm
            onSave={handleCreate}
            onCancel={() => setShowCreate(false)}
            saving={saving}
          />
        </DialogContent>
      </Dialog>

      {/* ── Edit dialog ── */}
      <Dialog open={Boolean(editingMemory)} onOpenChange={(open) => !open && setEditingMemory(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit memory</DialogTitle>
          </DialogHeader>
          {editingMemory && (
            <MemoryForm
              initial={editingMemory}
              onSave={handleUpdate}
              onCancel={() => setEditingMemory(null)}
              saving={saving}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
