import {auth} from "@/lib/firebase";

/** Best-effort server revocation performed before destroying the web session. */
export async function revokeExtensionCredentials(): Promise<void> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) return;
  const response = await fetch("/api/extension/revoke-all", {method: "POST", headers: {Authorization: `Bearer ${token}`, "Content-Type": "application/json"}});
  if (!response.ok) throw new Error("extension_revoke_failed");
}
