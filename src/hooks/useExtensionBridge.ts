/**
 * useExtensionBridge
 *
 * Handles PWA share target payloads. The previous global token relay was
 * intentionally removed because Firebase ID tokens must not be broadcast on
 * window events where any page script can listen for them.
 */

import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export const useExtensionBridge = () => {
  const navigate = useNavigate();
  const location = useLocation();

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
