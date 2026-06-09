import React, { useState } from 'react';
import { sharedMemoryClient, SharedMemoryRecord } from '@/utils/sharedMemoryClient';
import { toast } from 'sonner';

export function SharedMemoryDevPanel() {
  const [isRunning, setIsRunning] = useState(false);
  const [lastCreated, setLastCreated] = useState<SharedMemoryRecord | null>(null);
  const [lastResults, setLastResults] = useState<SharedMemoryRecord[]>([]);

  const runSmokeTest = async () => {
    setIsRunning(true);

    try {
      const seed = Date.now();
      const title = `Shared memory smoke test ${seed}`;

      const created = await sharedMemoryClient.create({
        title,
        content: `Smoke test created at ${new Date(seed).toISOString()}`,
        summary: 'Dev panel smoke test memory',
        tags: ['smoke-test', 'shared-memory'],
        people: ['Nia'],
        project: 'save-me',
        type: 'dev_test',
        source: 'agent',
        visibility: 'shared_with_agents',
        verification: 'system_verified',
        confidence: 0.99,
        metadata: { source: 'SharedMemoryDevPanel', seed },
      });

      setLastCreated(created.memory);

      const fetched = await sharedMemoryClient.get(created.memory.id);
      const updated = await sharedMemoryClient.update(created.memory.id, {
        summary: 'Updated by dev panel smoke test',
        tags: ['smoke-test', 'shared-memory', 'updated'],
      });
      const listed = await sharedMemoryClient.list({
        limit: 5,
        project: 'save-me',
        visibility: 'shared_with_agents',
      });
      const searched = await sharedMemoryClient.search({
        query: title,
        limit: 5,
        project: 'save-me',
      });

      setLastResults(searched.memories);

      toast.success('Shared memory smoke test passed', {
        description: `Created, fetched, updated, listed, and searched ${fetched.memory.id}`,
      });

      console.log('sharedMemory smoke test', {
        created: created.memory,
        fetched: fetched.memory,
        updated: updated.memory,
        listed: listed.memories,
        searched: searched.memories,
      });
    } catch (error) {
      console.error('Shared memory smoke test failed', error);
      toast.error('Shared memory smoke test failed', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="rounded-xl border border-dashed bg-card/60 p-4 space-y-3">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold">Dev: Shared Memory Smoke Test</h3>
          <p className="text-xs text-muted-foreground">
            Runs create, get, update, list, and search against live Firebase functions.
          </p>
        </div>
        <button
          type="button"
          onClick={runSmokeTest}
          disabled={isRunning}
          className="inline-flex items-center rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {isRunning ? 'Running...' : 'Run smoke test'}
        </button>
      </div>

      {lastCreated && (
        <div className="rounded-lg bg-muted/50 p-3 text-xs space-y-1">
          <div><span className="font-medium">Last created:</span> {lastCreated.title}</div>
          <div><span className="font-medium">ID:</span> {lastCreated.id}</div>
          <div><span className="font-medium">Project:</span> {lastCreated.project || 'none'}</div>
        </div>
      )}

      {lastResults.length > 0 && (
        <div className="rounded-lg bg-muted/50 p-3 text-xs space-y-1">
          <div className="font-medium">Latest search results</div>
          {lastResults.slice(0, 3).map((memory) => (
            <div key={memory.id} className="truncate">
              {memory.title}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
