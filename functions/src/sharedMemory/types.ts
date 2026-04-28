export type SharedMemoryType =
  | "preference"
  | "fact"
  | "decision"
  | "task"
  | "idea"
  | "summary"
  | "project_context"
  | "conversation_memory"
  | "relationship"
  | "document_note";

export type SharedMemorySource =
  | "human"
  | "openclaw"
  | "hermes"
  | "claude"
  | "codex"
  | "cursor"
  | "gemini"
  | "custom_agent"
  | "automation"
  | "import"
  | "system";

export type SharedMemoryVerification =
  | "unverified"
  | "agent_suggested"
  | "human_confirmed"
  | "system_verified";

export type SharedMemoryVisibility =
  | "private"
  | "shared_with_agents"
  | "shared_with_selected_agents";

export type SharedMemoryStatus =
  | "active"
  | "archived"
  | "superseded"
  | "deleted";

export interface SharedMemoryMetadata {
  conversation_id?: string;
  session_id?: string;
  external_ref?: string;
  related_memory_ids?: string[];
  original_format?: string;
  [key: string]: unknown;
}

export interface SharedMemoryCreateInput {
  title: string;
  content: string;
  summary?: string;
  type: SharedMemoryType;
  source: SharedMemorySource;
  sourceAgent?: string | null;
  createdBy?: string;
  tags?: string[];
  people?: string[];
  project?: string | null;
  confidence?: number | null;
  verification?: SharedMemoryVerification;
  visibility?: SharedMemoryVisibility;
  metadata?: SharedMemoryMetadata;
}

export interface SharedMemorySearchInput {
  query?: string;
  types?: SharedMemoryType[];
  project?: string | null;
  verification?: SharedMemoryVerification[];
  sources?: SharedMemorySource[];
  visibility?: SharedMemoryVisibility[];
  limit?: number;
}
