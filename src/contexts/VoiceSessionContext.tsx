/* eslint-disable react-refresh/only-export-components */
import React, {createContext, useCallback, useContext, useEffect, useRef, useState} from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {toast} from "sonner";
import {useAuth} from "@/contexts/AuthContext";
import {useTheme} from "@/components/ThemeProvider";
import {useVoiceAgent} from "@/hooks/useVoiceAgent";
import type {NovaActionPayload} from "@/hooks/voiceAgentTypes";
import type {SavedEntry} from "@/types/dashboard";

export interface SessionMemory {
  id: string;
  title: string;
  category: string;
}

type VoiceSession = ReturnType<typeof useVoiceAgent> & {
  savedMemories: SessionMemory[];
  rememberSavedEntry: (entry: SessionMemory) => void;
  draft: string;
  setDraft: React.Dispatch<React.SetStateAction<string>>;
};
const VoiceSessionContext = createContext<VoiceSession | null>(null);

export const useVoiceSession = () => {
  const session = useContext(VoiceSessionContext);
  if (!session) throw new Error("Voice controls must be inside VoiceSessionProvider");
  return session;
};

// Key the complete session to its account. Route changes never own its lifetime.
export const VoiceSessionProvider = ({children}: {children: React.ReactNode}) => {
  const {user} = useAuth();
  return <VoiceSessionOwner key={user?.uid || "signed-out"}>{children}</VoiceSessionOwner>;
};

const VoiceSessionOwner = ({children}: {children: React.ReactNode}) => {
  const navigate = useNavigate();
  const {pathname} = useLocation();
  const {setTheme} = useTheme();
  const [savedMemories, setSavedMemories] = useState<SessionMemory[]>([]);
  const [draft, setDraft] = useState("");
  const exportTimer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(exportTimer.current), []);

  const rememberSavedEntry = useCallback((entry: SessionMemory) => {
    setSavedMemories((current) => [entry, ...current.filter((item) => item.id !== entry.id)].slice(0, 20));
  }, []);

  const handleAction = useCallback(({actionType, actionData}: NovaActionPayload) => {
    if (["save_entry", "update_entry", "delete_entry"].includes(actionType)) {
      window.dispatchEvent(new CustomEvent("nova:entries-changed", {detail: {actionType, id: actionData.id}}));
    }
    if ((actionType === "save_entry" || actionType === "update_entry") && typeof actionData.id === "string") {
      rememberSavedEntry({id: actionData.id, title: String(actionData.title || "Saved memory"), category: String(actionData.category || "Personal")});
      toast.success(actionType === "save_entry" ? "Memory saved" : "Memory updated");
    }
    if (actionType === "delete_entry") {
      setSavedMemories((current) => current.filter((entry) => entry.id !== actionData.id));
    }
    if (actionType === "search" && actionData.query) navigate(`/all-entries?search=${encodeURIComponent(String(actionData.query))}`);
  }, [navigate, rememberSavedEntry]);

  const voice = useVoiceAgent({
    continuous: true,
    onNavigate: (route) => navigate(route),
    onOpenEntryForm: (category) => navigate(`/dashboard?action=create${category ? `&category=${encodeURIComponent(category)}` : ""}`),
    onOpenEntry: (id, title) => navigate(id ? `/all-entries/${encodeURIComponent(id)}` : `/all-entries?search=${encodeURIComponent(title || "")}`),
    onGoBack: () => {
      if (pathname === "/voice-capture") navigate(-1);
      else window.dispatchEvent(new CustomEvent("nova:close"));
    },
    onScrollPage: (direction) => {
      const target = document.querySelector("main") || document.documentElement;
      if (direction === "top" || direction === "bottom") target.scrollTo({top: direction === "top" ? 0 : target.scrollHeight, behavior: "smooth"});
      else target.scrollBy({top: window.innerHeight * (direction === "up" ? -0.8 : 0.8), behavior: "smooth"});
    },
    // Brain Dump is a view of the same conversation; do not auto-start another recorder.
    onStartBrainDump: () => navigate("/brain-dump"),
    onProcessBrainDump: () => window.dispatchEvent(new CustomEvent("brain-dump:process")),
    onSaveBrainDump: (category) => window.dispatchEvent(new CustomEvent("brain-dump:save", {detail: {category}})),
    onUpdateTheme: (theme) => {
      if (theme === "light" || theme === "dark" || theme === "system") setTheme(theme);
    },
    onSettingsUpdated: (setting, value, updates) => {
      window.dispatchEvent(new CustomEvent("nova:settings-updated", {detail: {setting, value, updates}}));
      toast.success("Settings updated");
    },
    onExportData: (format) => {
      navigate("/settings?tab=data-management");
      clearTimeout(exportTimer.current);
      exportTimer.current = setTimeout(() => window.dispatchEvent(new CustomEvent("nova:export-data", {detail: {format}})), 500);
    },
    onPrintEntry: async (entries) => {
      const printable = entries.filter((entry) => typeof entry.id === "string").map((entry) => ({
        id: entry.id as string, title: typeof entry.title === "string" ? entry.title : "Untitled",
        fields: entry.fields && typeof entry.fields === "object" ? entry.fields as SavedEntry["fields"] : {},
        createdAt: new Date(), updatedAt: new Date(),
      }));
      if (!printable.length) { toast.error("No printable entries found"); return; }
      const {printProfessionally} = await import("@/components/entries/ProfessionalPrintView");
      printProfessionally(printable, {title: printable.length === 1 ? printable[0].title : `${printable.length} Entries`, includeMetadata: true});
    },
    onNovaAction: handleAction,
  });

  const resetVoice = voice.resetConversation;
  const resetConversation = useCallback(() => {
    resetVoice();
    setSavedMemories([]);
    setDraft("");
  }, [resetVoice]);

  return <VoiceSessionContext.Provider value={{...voice, resetConversation, savedMemories, rememberSavedEntry, draft, setDraft}}>{children}</VoiceSessionContext.Provider>;
};
