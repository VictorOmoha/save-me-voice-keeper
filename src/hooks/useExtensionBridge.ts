/**
 * useExtensionBridge
 *
 * Two jobs:
 * 1. Relay the Firebase auth token to the browser extension (background.js)
 *    so the extension can make authenticated quickSave API calls without
 *    requiring a separate login flow inside the popup.
 *
 * 2. Handle PWA share target — when the app is opened via the OS share sheet
 *    (manifest.json share_target → /#/share?title=...&text=...&url=...)
 *    extract the shared data and pre-fill a save form.
 */

import { useEffect } from "react";
import { auth } from "@/lib/firebase";
import { useNavigate, useLocation } from "react-router-dom";

export const useExtensionBridge = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ── Token relay to browser extension ─────────────────────────────────────
  useEffect(() => {
    const relayToken = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const token = await user.getIdToken(false);

        // Dispatch event — content-script.js is listening for this
        window.dispatchEvent(new CustomEvent("saveme:auth-token", { detail: { token } }));
      } catch {
        // Not in extension context — no-op
      }
    };

    // Relay on load + whenever auth state changes
    relayToken();
    const unsub = auth.onIdTokenChanged(() => relayToken());

    // Also respond to extension requests
    const handleTokenRequest = () => relayToken();
    window.addEventListener("saveme:request-token", handleTokenRequest);

    return () => {
      unsub();
      window.removeEventListener("saveme:request-token", handleTokenRequest);
    };
  }, []);

  // ── PWA share target handler ──────────────────────────────────────────────
  useEffect(() => {
    if (location.pathname !== "/share") return;

    const params = new URLSearchParams(location.search);
    const title = params.get("title") || "";
    const text = params.get("text") || "";
    const url = params.get("url") || "";

    if (!title && !text && !url) return;

    // Navigate to dashboard with the shared data pre-loaded
    // Dashboard will check for this in sessionStorage
    const sharePayload = { title, content: text, url, fromShare: true };
    sessionStorage.setItem("saveme_share_payload", JSON.stringify(sharePayload));

    // Redirect to dashboard with Nova ready to save
    navigate("/dashboard?action=create&nova=open", { replace: true });
  }, [location, navigate]);
};
