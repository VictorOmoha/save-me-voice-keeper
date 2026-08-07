/**
 * SAVE-001 — Synthetic full-user fixture.
 *
 * **SYNTHETIC DATA ONLY.** Every value below is invented for testing and must
 * never be copied from, or correlated with, any real user. Canary/fake tokens
 * are used where a credential-shaped value is required.
 *
 * Purpose: a single self-contained fixture covering every user-linked resource
 * type enumerated in `docs/hardening/user-data-inventory.md`, so that deletion,
 * export, and tenant-isolation tests can be written against a known-complete
 * user graph.
 *
 * Covers: entries, documents (Storage), images (Storage), conversations,
 * reminders, notifications, memories, agent keys, billing metadata, analytics.
 */

// ─── Specification ───────────────────────────────────────────────────────────

export interface FullUserFixture {
  /** The synthetic Firebase Auth user. */
  authUser: {
    uid: string;
    email: string;
    displayName: string;
    provider: "google.com";
  };
  /** `users/{uid}` — account + Stripe billing mirror. */
  userDoc: Record<string, unknown>;
  /** `profiles/{uid}` */
  profileDoc: Record<string, unknown>;
  /** `user_preferences/{uid}` (includes a fake BYOK ElevenLabs key). */
  userPreferencesDoc: Record<string, unknown>;
  /** `search_preferences/{uid}` */
  searchPreferencesDoc: Record<string, unknown>;
  /** `entries/*` — at least one document entry and one image entry. */
  entries: Array<{ id: string; data: Record<string, unknown> }>;
  /** `nova_conversations/*` */
  conversations: Array<{ id: string; data: Record<string, unknown> }>;
  /** `nova_memories/*` */
  memories: Array<{ id: string; data: Record<string, unknown> }>;
  /** `shared_memories/*` — agent-readable mirror. */
  sharedMemories: Array<{ id: string; data: Record<string, unknown> }>;
  /** `api_keys/*` — one read-only, one read/write. */
  apiKeys: Array<{ id: string; data: Record<string, unknown> }>;
  /** `reminders/*` */
  reminders: Array<{ id: string; data: Record<string, unknown> }>;
  /** `pending_notifications/*` */
  notifications: Array<{ id: string; data: Record<string, unknown> }>;
  /** `action_items/*` */
  actionItems: Array<{ id: string; data: Record<string, unknown> }>;
  /** `entry_entities/*` (derived) */
  entryEntities: Array<{ id: string; data: Record<string, unknown> }>;
  /** `entry_links/*` (derived) */
  entryLinks: Array<{ id: string; data: Record<string, unknown> }>;
  /** `entity_graph/*` (derived) */
  entityGraph: Array<{ id: string; data: Record<string, unknown> }>;
  /** `user_patterns/*` (derived) */
  userPatterns: Array<{ id: string; data: Record<string, unknown> }>;
  /** `user_category_patterns/*` (derived) */
  userCategoryPatterns: Array<{ id: string; data: Record<string, unknown> }>;
  /** `storage_usage/{uid}` */
  storageUsageDoc: Record<string, unknown>;
  /** `search_analytics/*` */
  searchAnalytics: Array<{ id: string; data: Record<string, unknown> }>;
  /** `webhook_events/*` */
  webhookEvents: Array<{ id: string; data: Record<string, unknown> }>;
  /** `support_tickets/*` */
  supportTickets: Array<{ id: string; data: Record<string, unknown> }>;
  /** Storage objects (path → synthetic bytes descriptor). */
  storageObjects: Array<{ path: string; contentType: string; sizeBytes: number }>;
}

// ─── Canary / fake values ────────────────────────────────────────────────────

export const FAKE_UID = "syn-user-000000000000000000000001";
export const FAKE_EMAIL = "synthetic.user@example.invalid";
export const FAKE_STRIPE_CUSTOMER = "cus_SYNTHETIC000000000";
export const FAKE_STRIPE_SUBSCRIPTION = "sub_SYNTHETIC000000000";
export const FAKE_BYOK_ELEVENLABS = "sk_SYNTHETIC_elevenlabs_canary_00000000";
/** SHA-256 of a canary agent key, not a real credential. */
export const FAKE_AGENT_KEY_HASH_RO =
  "00000000000000000000000000000000000000000000000000000000000000aa";
export const FAKE_AGENT_KEY_HASH_RW =
  "00000000000000000000000000000000000000000000000000000000000000bb";

// ─── Fixture ─────────────────────────────────────────────────────────────────

export function buildFullUserFixture(nowIso = "2026-08-07T12:00:00.000Z"): FullUserFixture {
  const uid = FAKE_UID;
  const entryDocId = "syn-entry-doc-001";
  const entryImgId = "syn-entry-img-001";

  return {
    authUser: {
      uid,
      email: FAKE_EMAIL,
      displayName: "Synthetic User",
      provider: "google.com",
    },

    userDoc: {
      email: FAKE_EMAIL,
      stripeCustomerId: FAKE_STRIPE_CUSTOMER,
      subscriptionId: FAKE_STRIPE_SUBSCRIPTION,
      subscriptionStatus: "active",
      subscriptionTier: "pro",
      created_at: nowIso,
      updated_at: nowIso,
    },

    profileDoc: {
      display_name: "Synthetic User",
      timezone: "America/New_York",
      created_at: nowIso,
      updated_at: nowIso,
    },

    userPreferencesDoc: {
      theme: "dark",
      elevenlabs_api_key: FAKE_BYOK_ELEVENLABS, // BYOK — must be scrubbed on delete/export
      selected_tts_service: "elevenlabs",
      created_at: nowIso,
      updated_at: nowIso,
    },

    searchPreferencesDoc: {
      preferredCategories: ["Personal", "Work"],
      searchSuggestionsEnabled: true,
      voiceSearchEnabled: true,
      semanticSearchEnabled: true,
      autoCompleteEnabled: true,
      recentSearchesLimit: 10,
    },

    entries: [
      {
        id: entryDocId,
        data: {
          title: "Synthetic document entry",
          fields: {
            content: "This is synthetic document content for testing only.",
            category: "Work",
            storagePath: `documents/${uid}/${entryDocId}/notes.txt`,
          },
          field_definitions: [
            { id: "content", name: "Content", type: "textarea" },
          ],
          category: "Work",
          user_id: uid,
          processed: false,
          source: "web_app",
          created_at: nowIso,
          updated_at: nowIso,
        },
      },
      {
        id: entryImgId,
        data: {
          title: "Synthetic image entry",
          fields: {
            content: "Synthetic image caption.",
            category: "Personal",
            imageUrl: `https://storage.invalid/images/${uid}/syn-image-001.jpg`,
          },
          field_definitions: [
            { id: "content", name: "Content", type: "textarea" },
          ],
          category: "Personal",
          user_id: uid,
          processed: true,
          source: "web_app",
          created_at: nowIso,
          updated_at: nowIso,
        },
      },
    ],

    conversations: [
      {
        id: "syn-conv-001",
        data: {
          user_id: uid,
          turns: [
            { role: "user", text: "Synthetic user turn.", at: nowIso },
            { role: "assistant", text: "Synthetic assistant reply.", at: nowIso },
          ],
          created_at: nowIso,
          updated_at: nowIso,
        },
      },
    ],

    memories: [
      {
        id: "syn-mem-001",
        data: {
          user_id: uid,
          content: "Synthetic memory: user prefers morning briefings.",
          active: true,
          confidence: 0.9,
          created_at: nowIso,
          updated_at: nowIso,
        },
      },
    ],

    sharedMemories: [
      {
        id: "syn-shared-001",
        data: {
          user_id: uid,
          title: "Synthetic shared memory",
          content: "Mirrored synthetic memory for agent access.",
          type: "fact",
          source: "system",
          status: "active",
          visibility: "shared_with_agents",
          verification: "system_verified",
          created_at: nowIso,
          updated_at: nowIso,
        },
      },
    ],

    apiKeys: [
      {
        id: "syn-key-ro-001",
        data: {
          user_id: uid,
          name: "Synthetic read-only key",
          agent_type: "custom",
          agent_source: "custom_agent",
          key_hash: FAKE_AGENT_KEY_HASH_RO,
          key_prefix: "sm_synthro...",
          permissions: ["read"],
          is_active: true,
          created_at: nowIso,
          last_used_at: null,
        },
      },
      {
        id: "syn-key-rw-001",
        data: {
          user_id: uid,
          name: "Synthetic read-write key",
          agent_type: "custom",
          agent_source: "custom_agent",
          key_hash: FAKE_AGENT_KEY_HASH_RW,
          key_prefix: "sm_synthrw...",
          permissions: ["read", "write"],
          is_active: true,
          created_at: nowIso,
          last_used_at: null,
        },
      },
    ],

    reminders: [
      {
        id: "syn-rem-001",
        data: {
          user_id: uid,
          text: "Synthetic reminder",
          task_text: "Synthetic reminder",
          notification_text: "Reminder: Synthetic reminder",
          type: "task_reminder",
          source: "voice_agent",
          trigger_at: nowIso,
          entry_id: entryDocId,
          action_item_id: null,
          status: "pending",
          created_at: nowIso,
          updated_at: nowIso,
        },
      },
    ],

    notifications: [
      {
        id: "syn-notif-001",
        data: {
          user_id: uid,
          type: "reminder",
          text: "Reminder: Synthetic reminder",
          task_text: "Synthetic reminder",
          entry_id: entryDocId,
          reminder_id: "syn-rem-001",
          status: "pending",
          created_at: nowIso,
        },
      },
    ],

    actionItems: [
      {
        id: "syn-action-001",
        data: {
          user_id: uid,
          entry_id: entryDocId,
          text: "Synthetic action item",
          status: "open",
          created_at: nowIso,
        },
      },
    ],

    entryEntities: [
      {
        id: "syn-ent-001",
        data: {
          user_id: uid,
          entry_id: entryDocId,
          entity: "Synthetic Entity",
          snippet: "Synthetic 200-char content snippet for testing derived data.",
          created_at: nowIso,
        },
      },
    ],

    entryLinks: [
      {
        id: "syn-link-001",
        data: {
          user_id: uid,
          source_entry_id: entryDocId,
          target_entry_id: entryImgId,
          strength: 0.5,
          created_at: nowIso,
        },
      },
    ],

    entityGraph: [
      {
        id: "syn-graph-001",
        data: {
          user_id: uid,
          entity: "Synthetic Entity",
          weight: 1,
          created_at: nowIso,
          updated_at: nowIso,
        },
      },
    ],

    userPatterns: [
      {
        id: "syn-pattern-001",
        data: {
          user_id: uid,
          pattern: "synthetic_pattern",
          active: true,
          confidence: 0.8,
          created_at: nowIso,
        },
      },
    ],

    userCategoryPatterns: [
      {
        id: "syn-catpat-001",
        data: {
          user_id: uid,
          category: "Work",
          weight: 0.7,
          created_at: nowIso,
        },
      },
    ],

    storageUsageDoc: {
      user_id: uid,
      used_bytes: 2048,
      limit_bytes: 10485760,
      updated_at: nowIso,
    },

    searchAnalytics: [
      {
        id: "syn-search-001",
        data: {
          user_id: uid,
          query: "synthetic query",
          results_count: 1,
          clicked_result_id: entryDocId,
          search_type: "text",
          response_time_ms: 42,
          created_at: nowIso,
        },
      },
    ],

    webhookEvents: [
      {
        id: "syn-webhook-001",
        data: {
          user_id: uid,
          event_type: "entry.created",
          payload: { id: entryDocId, title: "Synthetic document entry" },
          webhook_url: "https://hooks.example.invalid/synthetic",
          status: "pending",
          created_at: nowIso,
        },
      },
    ],

    supportTickets: [
      {
        id: "syn-ticket-001",
        data: {
          user_id: uid,
          subject: "Synthetic support ticket",
          body: "Synthetic support body.",
          status: "open",
          created_at: nowIso,
        },
      },
    ],

    storageObjects: [
      {
        path: `documents/${uid}/${entryDocId}/notes.txt`,
        contentType: "text/plain",
        sizeBytes: 128,
      },
      {
        path: `images/${uid}/syn-image-001.jpg`,
        contentType: "image/jpeg",
        sizeBytes: 1920,
      },
    ],
  };
}

export default buildFullUserFixture;
