/**
 * SaveMe.Space — Hermes Adapter (Cognibrowse)
 *
 * Allows Hermes (and other Cognibrowse agents) to read from and write to the
 * SaveMe.Space shared memory layer.
 *
 * Auth: uses SAVEME_HERMES_API_KEY env var (matches AGENT_API_KEY on Firebase Functions side)
 * User: uses SAVEME_HERMES_USER_ID env var (defaults to "hermes-cognibrowse-agent")
 *
 * Usage (as a module):
 *   import { saveMeMemory } from './hermes-adapter/index.js';
 *   await saveMeMemory.remember({ title: '...', content: '...' });
 *   const context = await saveMeMemory.contextFor('page research topic');
 */

const BASE_URL =
  process.env.SAVEME_FUNCTIONS_URL ||
  'https://us-central1-saveme-f5af0.cloudfunctions.net';

const API_KEY = process.env.SAVEME_HERMES_API_KEY || process.env.SAVEME_AGENT_API_KEY || '';

function authHeaders() {
  if (!API_KEY) throw new Error('SAVEME_HERMES_API_KEY is not set');
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
   * Save a memory from Hermes into shared_memories.
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
   * @param {string} [input.verification]
   * @param {string} [input.visibility]
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
      source: 'hermes',
      sourceAgent: 'hermes',
      createdBy: 'hermes',
      confidence: input.confidence ?? 0.85,
      verification: input.verification || 'agent_suggested',
      visibility: input.visibility || 'shared_with_agents',
      metadata: {
        agent: 'hermes',
        platform: 'cognibrowse',
        ...input.metadata,
      },
    });
    return { ok: result.ok, memory: { id: result.id } };
  },

  /**
   * Save a browsing-derived memory (e.g. page research, extracted facts).
   *
   * @param {object} input
   * @param {string} input.title
   * @param {string} input.content
   * @param {string} [input.url] - source URL
   * @param {string} [input.pageTitle]
   * @param {string} [input.summary]
   * @param {string[]} [input.tags]
   * @param {string} [input.project]
   */
  async savePageMemory(input) {
    return this.remember({
      title: input.title,
      content: input.content,
      summary: input.summary || null,
      tags: [...(input.tags || []), 'web-research', 'page-memory'],
      project: input.project || null,
      type: 'fact',
      confidence: 0.8,
      verification: 'agent_suggested',
      visibility: 'shared_with_agents',
      metadata: {
        source_url: input.url || null,
        page_title: input.pageTitle || null,
        pipeline: 'hermes_browse',
      },
    });
  },

  /**
   * Save a user decision or preference extracted during browsing.
   *
   * @param {object} input
   * @param {string} input.title
   * @param {string} input.content
   * @param {string} [input.project]
   * @param {string} [input.url]
   */
  async saveDecision(input) {
    return this.remember({
      title: input.title,
      content: input.content,
      type: 'decision',
      project: input.project || null,
      confidence: 0.9,
      verification: 'agent_suggested',
      visibility: 'shared_with_agents',
      metadata: {
        source_url: input.url || null,
        pipeline: 'hermes_decision',
      },
    });
  },

  /**
   * Search shared memories.
   *
   * @param {string} query
   * @param {object} [options]
   */
  async search(query, options = {}) {
    const result = await post('sharedMemorySearch', {
      query,
      limit: options.limit || 10,
      project: options.project || undefined,
      type: options.type || undefined,
    });
    return result.results || result.memories || [];
  },

  /**
   * List recent shared memories.
   *
   * @param {object} [options]
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
      tags: [...(m.tags || []), 'hermes'],
      people: m.people || [],
      project: m.project || null,
      type: m.type || 'fact',
      source: 'hermes',
      sourceAgent: 'hermes',
      createdBy: 'hermes',
      confidence: m.confidence ?? 0.85,
      verification: m.verification || 'agent_suggested',
      visibility: m.visibility || 'shared_with_agents',
      metadata: { agent: 'hermes', platform: 'cognibrowse', ...m.metadata },
    }));

    const result = await post('sharedMemoryBatchCreate', { memories: prepared });
    return (result.ids || []).map((id) => ({ id }));
  },

  /**
   * Context lookup for system prompt injection.
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
