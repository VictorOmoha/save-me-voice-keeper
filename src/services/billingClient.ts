import {auth} from "@/lib/firebase";

const baseUrl = import.meta.env.VITE_CLOUD_FUNCTIONS_URL;

const post = async (path: string, body: Record<string, unknown>): Promise<{url: string}> => {
  if (!baseUrl) throw new Error("Billing is not configured in this environment");
  const user = auth.currentUser;
  if (!user) throw new Error("Authentication required");
  const response = await fetch(`${baseUrl}/${path}`, {
    method: "POST",
    headers: {"Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}`},
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Billing request failed");
  if (typeof payload.url !== "string") throw new Error("Billing response has no URL");
  return {url: payload.url};
};

export const billingClient = {
  createCheckout: (plan: "basic" | "premium") => post("createCheckout", {plan}),
  createPortal: (returnUrl?: string) => post("customerPortal", returnUrl ? {returnUrl} : {}),
};
