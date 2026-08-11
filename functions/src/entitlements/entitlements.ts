import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

export type PlanId = "free" | "basic" | "premium";
export type Capability = "voice_ai" | "portable_export" | "browser_extension" | "advanced_search" | "agent_api";

export interface PlanEntitlements {
  id: PlanId;
  entryLimit: number | null;
  storageLimitBytes: number;
  capabilities: Readonly<Record<Capability, boolean>>;
}

const MB = 1024 * 1024;
const GB = 1024 * MB;

export const PLAN_CATALOG: Readonly<Record<PlanId, PlanEntitlements>> = Object.freeze({
  free: Object.freeze({
    id: "free" as const,
    entryLimit: 50,
    storageLimitBytes: 500 * MB,
    capabilities: Object.freeze({voice_ai: true, portable_export: true, browser_extension: false, advanced_search: false, agent_api: false}),
  }),
  basic: Object.freeze({
    id: "basic" as const,
    entryLimit: null,
    storageLimitBytes: 5 * GB,
    capabilities: Object.freeze({voice_ai: true, portable_export: true, browser_extension: true, advanced_search: true, agent_api: false}),
  }),
  premium: Object.freeze({
    id: "premium" as const,
    entryLimit: null,
    storageLimitBytes: 50 * GB,
    capabilities: Object.freeze({voice_ai: true, portable_export: true, browser_extension: true, advanced_search: true, agent_api: true}),
  }),
});

export type EntitlementErrorCode = "ENTITLEMENT_UNKNOWN_PLAN" | "ENTITLEMENT_REQUIRED" | "ENTRY_QUOTA_EXCEEDED" | "STORAGE_QUOTA_EXCEEDED" | "INVALID_ARGUMENT";

export class EntitlementError extends Error {
  constructor(
    public readonly code: EntitlementErrorCode,
    message: string,
    public readonly status: number,
    public readonly details?: Readonly<Record<string, unknown>>
  ) {
    super(message);
    this.name = "EntitlementError";
  }
}

export interface EntitlementErrorEnvelope {
  error: {code: EntitlementErrorCode; message: string; details?: Readonly<Record<string, unknown>>};
}

export const entitlementErrorEnvelope = (error: EntitlementError): EntitlementErrorEnvelope => ({
  error: {code: error.code, message: error.message, ...(error.details ? {details: error.details} : {})},
});

export const sendEntitlementError = (res: functions.Response, error: unknown): boolean => {
  if (!(error instanceof EntitlementError)) return false;
  res.status(error.status).json(entitlementErrorEnvelope(error));
  return true;
};

export const resolvePlan = (rawPlan: unknown, userDocumentExists = true): PlanEntitlements => {
  // Migration rule: a missing user doc or absent/null/blank plan is Free. An
  // explicit unrecognized value is never upgraded or silently normalized.
  if (!userDocumentExists || rawPlan === undefined || rawPlan === null || rawPlan === "") return PLAN_CATALOG.free;
  if (typeof rawPlan === "string" && Object.prototype.hasOwnProperty.call(PLAN_CATALOG, rawPlan)) {
    return PLAN_CATALOG[rawPlan as PlanId];
  }
  throw new EntitlementError("ENTITLEMENT_UNKNOWN_PLAN", "Account plan is not recognized", 403);
};

export const readUserEntitlements = async (
  uid: string,
  db: admin.firestore.Firestore = admin.firestore()
): Promise<PlanEntitlements> => {
  // Entitlements must come from a server-owned document. `users/{uid}` remains
  // client-writable profile data and is never authoritative for paid access.
  const snapshot = await db.collection("billing_entitlements").doc(uid).get();
  const data = snapshot.exists ? snapshot.data() : undefined;
  return resolvePlan(data?.plan, snapshot.exists);
};

export const assertCapability = (plan: PlanEntitlements, capability: Capability): void => {
  if (!plan.capabilities[capability]) {
    throw new EntitlementError("ENTITLEMENT_REQUIRED", `Capability '${capability}' is not included in the ${plan.id} plan`, 403, {
      capability,
      plan: plan.id,
    });
  }
};

// Named contracts keep universal rights explicit at call sites and prevent
// future feature work from accidentally treating them as paid differentiators.
export const assertPortableExportAccess = (plan: PlanEntitlements): void => assertCapability(plan, "portable_export");
export const assertVoiceAiAccess = (plan: PlanEntitlements): void => assertCapability(plan, "voice_ai");
export const assertBrowserExtensionAccess = (plan: PlanEntitlements): void => assertCapability(plan, "browser_extension");
export const assertAdvancedSearchAccess = (plan: PlanEntitlements): void => assertCapability(plan, "advanced_search");
export const assertAgentApiAccess = (plan: PlanEntitlements): void => assertCapability(plan, "agent_api");

export const assertEntryAdmission = (plan: PlanEntitlements, currentEntries: number, requestedEntries = 1): void => {
  if (!Number.isSafeInteger(currentEntries) || currentEntries < 0 || !Number.isSafeInteger(requestedEntries) || requestedEntries < 1) {
    throw new EntitlementError("INVALID_ARGUMENT", "Entry counts must be non-negative integers", 400);
  }
  if (plan.entryLimit !== null && currentEntries + requestedEntries > plan.entryLimit) {
    throw new EntitlementError("ENTRY_QUOTA_EXCEEDED", "Entry quota exceeded", 409, {
      plan: plan.id,
      limit: plan.entryLimit,
      used: currentEntries,
      requested: requestedEntries,
    });
  }
};

export const assertStorageAdmission = (plan: PlanEntitlements, bytesUsed: number, requestedBytes: number): void => {
  if (!Number.isSafeInteger(bytesUsed) || bytesUsed < 0 || !Number.isSafeInteger(requestedBytes) || requestedBytes < 1) {
    throw new EntitlementError("INVALID_ARGUMENT", "Storage byte counts must be positive safe integers", 400);
  }
  if (bytesUsed + requestedBytes > plan.storageLimitBytes) {
    throw new EntitlementError("STORAGE_QUOTA_EXCEEDED", "Storage quota exceeded", 409, {
      plan: plan.id,
      limitBytes: plan.storageLimitBytes,
      usedBytes: bytesUsed,
      requestedBytes,
    });
  }
};
