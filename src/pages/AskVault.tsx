import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Send, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useSavedEntries } from "@/hooks/useSavedEntries";
import { useAskVault, ConversationMessage } from "@/hooks/useAskVault";
import { useAuth } from "@/contexts/AuthContext";
import { SavedEntry } from "@/types/dashboard";

const SUGGESTED_QUESTIONS = [
  "How many entries do I have?",
  "Show my recent entries",
  "List my contacts",
];

export default function AskVault() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const {
    savedEntries,
    isLoading: entriesLoading,
    searchQuery,
    setSearchQuery,
    saveEntry,
    deleteEntry,
  } = useSavedEntries();

  const { messages, ask, isProcessing, clearHistory } =
    useAskVault(savedEntries);

  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auth check
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || !user) {
      navigate("/login");
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessing) return;
    ask(inputValue);
    setInputValue("");
    inputRef.current?.focus();
  };

  const handleSuggestedQuestion = (question: string) => {
    ask(question);
    inputRef.current?.focus();
  };

  const handleEntryClick = (entry: SavedEntry) => {
    navigate(`/all-entries/${entry.id}`);
  };

  // DashboardLayout requires these callbacks
  const handleAddEntry = () => navigate("/dashboard");
  const handleCategorySelect = (cat: string) =>
    navigate(`/category/${encodeURIComponent(cat)}`);
  const handleAllEntriesSelect = () => navigate("/all-entries");
  const noop = () => {};

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <DashboardLayout
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      userName={user?.displayName || user?.email || "User"}
      savedEntries={savedEntries}
      onAddEntry={handleAddEntry}
      onCategorySelect={handleCategorySelect}
      onAllEntriesSelect={handleAllEntriesSelect}
      onEditEntry={noop}
      onDeleteEntry={noop as any}
      onSaveEntry={noop}
      onCancelEdit={noop}
    >
      <div className="flex flex-col h-[calc(100vh-12rem)] md:h-[calc(100vh-10rem)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="protocol-tag mb-2">PROTOCOL: INTELLIGENCE</div>
            <h1 className="archive-title text-xl md:text-2xl flex items-center gap-2">
              <MessageSquare className="w-5 h-5 md:w-6 md:h-6" />
              ASK YOUR VAULT
            </h1>
            <p className="mono text-xs text-muted-foreground mt-1">
              QUERY YOUR ENTRIES USING NATURAL LANGUAGE
            </p>
          </div>
          {messages.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearHistory}
              className="mono text-xs border-galvanized"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              CLEAR
            </Button>
          )}
        </div>

        {/* Conversation area */}
        <div className="flex-1 min-h-0 galvanized-card">
          <ScrollArea className="h-full p-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <Search className="w-12 h-12 text-muted-foreground mb-4 opacity-40" />
                <p className="mono text-sm text-muted-foreground mb-6">
                  No messages yet — ask me anything about your vault!
                </p>

                {/* Suggested questions */}
                <div className="flex flex-col gap-2 w-full max-w-md">
                  <p className="mono text-xs text-muted-foreground mb-1">
                    TRY ASKING:
                  </p>
                  {SUGGESTED_QUESTIONS.map((q) => (
                    <Button
                      key={q}
                      variant="outline"
                      size="sm"
                      className="mono text-xs text-left justify-start border-galvanized hover:border-primary"
                      onClick={() => handleSuggestedQuestion(q)}
                    >
                      <MessageSquare className="w-3 h-3 mr-2 flex-shrink-0" />
                      {q}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    onEntryClick={handleEntryClick}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Input area */}
        <form
          onSubmit={handleSubmit}
          className="flex gap-2 mt-3 items-center"
        >
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about your entries..."
            className="flex-1 mono text-sm border-galvanized focus:border-primary"
            disabled={isProcessing}
            autoFocus
          />
          <Button
            type="submit"
            size="icon"
            disabled={!inputValue.trim() || isProcessing}
            className="flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
}

// ---------------------------------------------------------------------------
// MessageBubble sub-component
// ---------------------------------------------------------------------------

interface MessageBubbleProps {
  message: ConversationMessage;
  onEntryClick: (entry: SavedEntry) => void;
}

function MessageBubble({ message, onEntryClick }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] ${
          isUser
            ? "bg-primary text-primary-foreground rounded-lg rounded-br-sm px-4 py-2"
            : "bg-card border border-galvanized rounded-lg rounded-bl-sm px-4 py-3"
        }`}
      >
        {/* Message content */}
        <div
          className={`mono text-sm whitespace-pre-wrap ${
            isUser ? "" : "text-foreground"
          }`}
        >
          {renderContent(message.content)}
        </div>

        {/* Matched entries as cards */}
        {!isUser &&
          message.matchedEntries &&
          message.matchedEntries.length > 0 && (
            <div className="mt-3 space-y-2">
              {message.matchedEntries.slice(0, 5).map((entry) => (
                <Card
                  key={entry.id}
                  className="cursor-pointer border-galvanized hover:border-primary transition-colors"
                  onClick={() => onEntryClick(entry)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <span className="mono text-xs font-medium truncate">
                        {entry.title}
                      </span>
                      {entry.category && (
                        <span className="badge-skeletal text-[10px] ml-2 flex-shrink-0">
                          {entry.category}
                        </span>
                      )}
                    </div>
                    <p className="mono text-[10px] text-muted-foreground mt-1">
                      {entry.createdAt.toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
              {message.matchedEntries.length > 5 && (
                <p className="mono text-[10px] text-muted-foreground text-center">
                  +{message.matchedEntries.length - 5} more entries
                </p>
              )}
            </div>
          )}

        {/* Timestamp */}
        <p
          className={`mono text-[10px] mt-1 ${
            isUser
              ? "text-primary-foreground/60"
              : "text-muted-foreground"
          }`}
        >
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Simple markdown-like renderer (bold only)
// ---------------------------------------------------------------------------

function renderContent(text: string): React.ReactNode {
  // Split on **bold** markers
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}
