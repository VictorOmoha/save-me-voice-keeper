import { getCloudFunctionUrl, getFirebaseIdToken } from '@/utils/cloudFunctions';

export type SharedMemoryVerification = 'unverified' | 'verified' | 'disputed';
export type SharedMemoryVisibility = 'private' | 'shared';
export type SharedMemoryStatus = 'active' | 'archived';

export interface SharedMemoryRecord {
  id: string;
  user_id: string;
  title: string;
  content: string;
  summary?: string;
  tags: string[];
  people: string[];
  project?: string;
  type: string;
  source: string;
  visibility: SharedMemoryVisibility;
  verification: SharedMemoryVerification;
  confidence?: number;
  metadata?: Record<string, unknown>;
  source_agent?: string;
  created_by?: string;
  status: SharedMemoryStatus;
  created_at?: unknown;
  updated_at?: unknown;
  last_accessed_at?: unknown;
  access_count?: number;
}

export interface SharedMemoryCreateInput {
  title: string;
  content: string;
  summary?: string;
  tags?: string[];
  people?: string[];
  project?: string;
  type?: string;
  source?: string;
  visibility?: SharedMemoryVisibility;
  verification?: SharedMemoryVerification;
  confidence?: number;
  metadata?: Record<string, unknown>;
  source_agent?: string;
  created_by?: string;
  status?: SharedMemoryStatus;
}

export interface SharedMemorySearchInput {
  query: string;
  limit?: number;
  type?: string | string[];
  project?: string | string[];
  verification?: SharedMemoryVerification | SharedMemoryVerification[];
  source?: string | string[];
  visibility?: SharedMemoryVisibility | SharedMemoryVisibility[];
}

export interface SharedMemoryListInput {
  limit?: number;
  type?: string | string[];
  project?: string | string[];
  verification?: SharedMemoryVerification | SharedMemoryVerification[];
  source?: string | string[];
  visibility?: SharedMemoryVisibility | SharedMemoryVisibility[];
  status?: SharedMemoryStatus;
}

export interface SharedMemoryUpdateInput {
  title?: string;
  content?: string;
  summary?: string;
  tags?: string[];
  people?: string[];
  project?: string;
  confidence?: number;
  verification?: SharedMemoryVerification;
  visibility?: SharedMemoryVisibility;
  status?: SharedMemoryStatus;
  metadata?: Record<string, unknown>;
}

async function authedPost<T>(functionName: string, body: Record<string, unknown>): Promise<T> {
  const token = await getFirebaseIdToken();

  const response = await fetch(getCloudFunctionUrl(functionName), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const sharedMemoryClient = {
  create: (input: SharedMemoryCreateInput) =>
    authedPost<{ ok: true; memory: SharedMemoryRecord }>('sharedMemoryCreate', input),

  batchCreate: (memories: SharedMemoryCreateInput[]) =>
    authedPost<{ ok: true; memories: SharedMemoryRecord[] }>('sharedMemoryBatchCreate', { memories }),

  search: (input: SharedMemorySearchInput) =>
    authedPost<{ ok: true; memories: SharedMemoryRecord[] }>('sharedMemorySearch', input),

  get: (id: string) =>
    authedPost<{ ok: true; memory: SharedMemoryRecord }>('sharedMemoryGet', { id }),

  list: (input: SharedMemoryListInput = {}) =>
    authedPost<{ ok: true; memories: SharedMemoryRecord[] }>('sharedMemoryList', input),

  update: (id: string, patch: SharedMemoryUpdateInput) =>
    authedPost<{ ok: true; memory: SharedMemoryRecord }>('sharedMemoryUpdate', { id, patch }),
};
