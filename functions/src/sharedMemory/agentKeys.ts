import {createHash, randomBytes} from "crypto";

export type SharedMemoryPermission = "read" | "write";

const ALLOWED_PERMISSIONS: SharedMemoryPermission[] = ["read", "write"];

export const generateAgentApiKey = (): string => {
  return `sm_${randomBytes(32).toString("base64url")}`;
};

export const hashAgentApiKey = (apiKey: string): string => {
  return createHash("sha256").update(apiKey).digest("hex");
};

export const normalizeAgentPermissions = (permissions: unknown): SharedMemoryPermission[] => {
  if (!Array.isArray(permissions)) return [...ALLOWED_PERMISSIONS];

  const normalized = ALLOWED_PERMISSIONS.filter((permission) => permissions.includes(permission));
  return normalized.length > 0 ? normalized : [...ALLOWED_PERMISSIONS];
};
