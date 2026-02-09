import { useState, useCallback, useEffect } from "react";
import { SavedEntry } from "@/types/dashboard";
import { queryVault, VaultQueryResult } from "@/utils/vaultQueryEngine";

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  matchedEntries?: SavedEntry[];
  timestamp: Date;
}

const SESSION_STORAGE_KEY = "ask_vault_conversation";

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function loadMessages(): ConversationMessage[] {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((m: any) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    }));
  } catch {
    return [];
  }
}

function saveMessages(messages: ConversationMessage[]): void {
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(messages));
  } catch {
    // sessionStorage might be full or unavailable; fail silently
  }
}

export function useAskVault(entries: SavedEntry[]) {
  const [messages, setMessages] = useState<ConversationMessage[]>(loadMessages);
  const [isProcessing, setIsProcessing] = useState(false);

  // Persist messages to sessionStorage whenever they change
  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  const ask = useCallback(
    (question: string) => {
      const trimmed = question.trim();
      if (!trimmed) return;

      setIsProcessing(true);

      // Add user message
      const userMessage: ConversationMessage = {
        id: generateId(),
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };

      // Query the vault
      const result: VaultQueryResult = queryVault(trimmed, entries);

      // Add assistant response
      const assistantMessage: ConversationMessage = {
        id: generateId(),
        role: "assistant",
        content: result.answer,
        matchedEntries:
          result.matchedEntries.length > 0
            ? result.matchedEntries
            : undefined,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setIsProcessing(false);
    },
    [entries]
  );

  const clearHistory = useCallback(() => {
    setMessages([]);
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return { messages, ask, isProcessing, clearHistory };
}
