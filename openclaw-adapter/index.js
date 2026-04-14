/**
 * SaveMe.Space — OpenClaw Adapter
 *
 * Allows Nia (and other OpenClaw agents) to read from and write to the
 * SaveMe.Space shared memory layer.
 *
 * Auth: uses SAVEME_AGENT_API_KEY env var (matches AGENT_API_KEY on Firebase Functions side)
 * User: uses SAVEME_AGENT_USER_ID env var (defaults to "nia-openclaw-agent")
 *
 * Usage (as a module):
 *   import { saveMeMemory } from './openclaw-adapter/index.js';
 *   await saveMeMemory.remember({ title: '...', content: '...' });
 *   const results = await saveMeMemory.search('best barber shop lead');
 *   const recent = await saveMeMemory.list();
 */

const BASE_URL =
  process.env.SAVEME_FUNCTIONS_URL ||
  'https://us-central1-saveme-f5af0.cloudfunctions.net';

const API_KEY = process.env.SAVEME_AGENT_API_KEY || '';

function authHeaders() {
  if (!API_KEY) throw new Error('SAVEME_AGENT_API_KEY is not set');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${API_KEY}`,
  };
}

async function post(endpoint, body) {
  const url = `${BASE_URL}/${endpoint}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`SaveMe ${endpoint} failed [${res.status}]: ${err.error || res.statusText}`);
  }

  return res.json();
}

export const saveMeMemory = {
  /**
   * Write a memory into shared_memories.
   *
   * @param {object} input
   * @param {string} input.title
   * @param {string} input.content
   * @param {string} [input.summary]
   * @param {string[]} [input.tags]
   * @param {string[]} [input.people]
   * @param {string} [input.project]
   * @param {string} [input.type] - "fact" | "decision" | "preference" | "idea" | "task" | "summary" | "project_context" | "conversation_memory"
   * @param {number} [input.confidence]
   * @param {string} [input.verification] - "unverified" | "agent_suggested" | "human_confirmed"
   * @param {string} [input.visibility] - "private" | "shared_with_agents"
   * @param {object} [input.metadata]
   */
  async remember(input) {
    const result = await post('sharedMemoryCreate', {
      title: input.title,
      content: input.content,
      summary: input.summary || null,
      tags: input.tags || [],
      people: input.people || [],
      project: input.project || null,
      type: input.type || 'fact',
      source: 'openclaw',
      sourceAgent: 'nia',
      createdBy: 'nia',
      confidence: input.confidence ?? 0.85,
      verification: input.verification || 'agent_suggested',
      visibility: input.visibility || 'shared_with_agents',
      metadata: {
        agent: 'nia',
        session: 'openclaw',
        ...input.metadata,
      },
    });
    // sharedMemoryCreate returns { ok, id } — normalize to { ok, memory: { id } }
    return { ok: result.ok, memory: { id: result.id } };
  },

  /**
   * Search shared memories.
   *
   * @param {string} query
   * @param {object} [options]
   * @param {number} [options.limit]
   * @param {string} [options.project]
   * @param {string|string[]} [options.type]
   */
  async search(query, options = {}) {
    const result = await post('sharedMemorySearch', {
      query,
      limit: options.limit || 10,
      project: options.project || undefined,
      type: options.type || undefined,
    });
    // sharedMemorySearch returns { ok, results } — not memories
    return result.results || result.memories || [];
  },

  /**
   * List recent shared memories.
   *
   * @param {object} [options]
   * @param {number} [options.limit]
   * @param {string} [options.project]
   * @param {string|string[]} [options.type]
   * @param {string} [options.visibility]
   */
  async list(options = {}) {
    const result = await post('sharedMemoryList', {
      limit: options.limit || 20,
      project: options.project || undefined,
      type: options.type || undefined,
      visibility: options.visibility || 'shared_with_agents',
    });
    return result.memories || [];
  },

  /**
   * Fetch a single memory by ID.
   *
   * @param {string} id
   */
  async get(id) {
    const result = await post('sharedMemoryGet', { id });
    return result.memory;
  },

  /**
   * Update a memory.
   *
   * @param {string} id
   * @param {object} patch
   */
  async update(id, patch) {
    // sharedMemoryUpdate returns { ok } only
    await post('sharedMemoryUpdate', { id, patch });
    return { id, ...patch };
  },

  /**
   * Write multiple memories at once.
   *
   * @param {object[]} memories
   */
  async batchRemember(memories) {
    const prepared = memories.map((m) => ({
      title: m.title,
      content: m.content,
      summary: m.summary || null,
      tags: m.tags || [],
      people: m.people || [],
      project: m.project || null,
      type: m.type || 'fact',
      source: 'openclaw',
      sourceAgent: 'nia',
      createdBy: 'nia',
      confidence: m.confidence ?? 0.85,
      verification: m.verification || 'agent_suggested',
      visibility: m.visibility || 'shared_with_agents',
      metadata: { agent: 'nia', ...m.metadata },
    }));

    const result = await post('sharedMemoryBatchCreate', { memories: prepared });
    // batchCreate returns { ok, ids } — normalize to array of stubs
    return (result.ids || []).map((id) => ({ id }));
  },

  /**
   * Quick context lookup — searches and returns a formatted summary string
   * suitable for injecting into a system prompt.
   *
   * @param {string} query
   * @param {object} [options]
   * @returns {string}
   */
  async contextFor(query, options = {}) {
    const memories = await this.search(query, { limit: 5, ...options });
    if (!memories.length) return '';

    const lines = memories.map((m) => {
      const meta = [m.project, m.type, m.verification].filter(Boolean).join(' · ');
      return `• ${m.title}${m.summary ? `: ${m.summary}` : ''}${meta ? ` [${meta}]` : ''}`;
    });

    return `Relevant context from SaveMe:\n${lines.join('\n')}`;
  },
};

export default saveMeMemory;
