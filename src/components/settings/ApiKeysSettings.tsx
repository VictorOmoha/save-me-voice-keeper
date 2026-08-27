import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, Plus, Copy, Trash2, Eye, EyeOff, Bot, ShieldCheck, PlugZap, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs, deleteDoc, doc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { getCloudFunctionUrl, getCloudFunctionsBaseUrl, getFirebaseIdToken } from "@/utils/cloudFunctions";
import {
  AGENT_PRESETS,
  AgentPermission,
  AgentPresetId,
  buildAgentIntegrationSnippets,
} from "@/utils/agentIntegrationSnippets";

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  permissions: AgentPermission[];
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

type CreatedAgentKeyResponse = {
  ok: boolean;
  api_key?: string;
  error?: string;
};

const permissionLabel = (permissions: AgentPermission[]) => {
  if (permissions.includes("read") && permissions.includes("write")) return "Read + write";
  if (permissions.includes("write")) return "Write only";
  return "Read only";
};

export const ApiKeysSettings = () => {
  const { user } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newKeyName, setNewKeyName] = useState(AGENT_PRESETS[0].suggestedKeyName);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [showGeneratedKey, setShowGeneratedKey] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [testMessage, setTestMessage] = useState<string>("");
  const [selectedPreset, setSelectedPreset] = useState<AgentPresetId>("openclaw");
  const [permissions, setPermissions] = useState<AgentPermission[]>(["read", "write"]);

  const activePreset = useMemo(
    () => AGENT_PRESETS.find((preset) => preset.id === selectedPreset) || AGENT_PRESETS[0],
    [selectedPreset]
  );

  const fetchApiKeys = useCallback(async () => {
    if (!user) return;

    try {
      const apiKeysRef = collection(db, "api_keys");
      const q = query(
        apiKeysRef,
        where("user_id", "==", user.uid),
        orderBy("created_at", "desc")
      );

      const querySnapshot = await getDocs(q);
      const keys: ApiKey[] = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const keyPermissions: AgentPermission[] = Array.isArray(data.permissions) && data.permissions.length > 0
          ? data.permissions.filter((permission: unknown): permission is AgentPermission => permission === "read" || permission === "write")
          : ["read", "write"];

        keys.push({
          id: docSnap.id,
          name: data.name || "",
          key_prefix: data.key_prefix || "",
          permissions: keyPermissions,
          is_active: data.is_active ?? true,
          last_used_at: data.last_used_at?.toDate?.()?.toISOString() || null,
          created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        });
      });

      setApiKeys(keys);
    } catch (error) {
      console.error("Error fetching API keys:", error);
      toast.error("Failed to load API keys");
    }
  }, [user]);

  useEffect(() => {
    if (user) void fetchApiKeys();
  }, [user, fetchApiKeys]);

  const selectPreset = (preset: typeof AGENT_PRESETS[number]) => {
    setSelectedPreset(preset.id);
    setNewKeyName(preset.suggestedKeyName);
  };

  const togglePermission = (permission: AgentPermission) => {
    setPermissions((current) => {
      const next = current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission];
      return next.length > 0 ? next : current;
    });
  };

  const handleCreateApiKey = async () => {
    if (!newKeyName.trim()) {
      toast.error("Please enter a name for your API key");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to create API keys");
      return;
    }

    setIsLoading(true);
    try {
      const token = await getFirebaseIdToken();
      const response = await fetch(getCloudFunctionUrl("sharedMemoryCreateAgentKey"), {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newKeyName.trim(),
          agent_type: activePreset.id,
          agent_source: activePreset.source,
          permissions,
        }),
      });
      const data = await response.json().catch(() => ({})) as CreatedAgentKeyResponse;

      if (!response.ok || !data.ok || !data.api_key) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      setGeneratedKey(data.api_key);
      setShowGeneratedKey(true);
      setTestStatus("idle");
      setTestMessage("");
      void fetchApiKeys();
      toast.success("Agent API key created");
    } catch (error) {
      console.error("Error creating API key:", error);
      toast.error("Failed to create API key");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    try {
      const keyRef = doc(db, "api_keys", id);
      await deleteDoc(keyRef);

      void fetchApiKeys();
      toast.success("API key revoked");
    } catch (error) {
      console.error("Error deleting API key:", error);
      toast.error("Failed to delete API key");
    }
  };

  const testGeneratedKey = async () => {
    if (!generatedKey) return;
    setTestStatus("testing");
    setTestMessage("");

    try {
      const response = await fetch(getCloudFunctionUrl("sharedMemoryAgentStatus"), {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${generatedKey}`,
          "Content-Type": "application/json",
        },
        body: "{}",
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || `HTTP ${response.status}`);
      }

      const capabilities = data.capabilities || {};
      setTestStatus("success");
      setTestMessage(`Connected · read ${capabilities.read ? "on" : "off"}, write ${capabilities.write ? "on" : "off"}`);
      toast.success("Agent key connection verified");
    } catch (error) {
      setTestStatus("error");
      setTestMessage(error instanceof Error ? error.message : "Connection failed");
      toast.error("Agent key test failed");
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  return (
    <Card id="connect-agent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PlugZap className="w-5 h-5" />
          Connect an Agent
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Plug OpenClaw, Claude, Codex, Cursor, Gemini, or any custom AI agent into SaveMe as a persistent shared memory layer.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 md:grid-cols-3">
          {AGENT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => selectPreset(preset)}
              className={`text-left rounded-xl border p-3 transition-colors hover:bg-muted/60 ${
                selectedPreset === preset.id ? "border-primary bg-primary/5" : ""
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Bot className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">{preset.name}</span>
              </div>
              <p className="text-xs text-muted-foreground">{preset.description}</p>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-sm">Agent credentials</p>
            <p className="text-xs text-muted-foreground">{apiKeys.length} key{apiKeys.length === 1 ? "" : "s"} created · raw keys are shown once</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Create Agent Key
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create agent connection</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-muted-foreground" role="note">
                  A read key lets this third-party agent read your shared-memory records; a write key lets it add or change records. Current visibility labels do not enforce a verified per-agent record boundary. Raw keys are shown once, so connect only an agent you trust. Self-service revocation is not yet verified as reliable.
                </div>
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Bot className="w-4 h-4 text-primary" />
                    {activePreset.name}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Source label: <code>{activePreset.source}</code></p>
                </div>

                <div>
                  <Label htmlFor="keyName">Connection name</Label>
                  <Input
                    id="keyName"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g., Claude Code on laptop"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Permissions</Label>
                  <div className="flex flex-wrap gap-2">
                    {(["read", "write"] as AgentPermission[]).map((permission) => (
                      <Button
                        key={permission}
                        type="button"
                        variant={permissions.includes(permission) ? "default" : "outline"}
                        size="sm"
                        onClick={() => togglePermission(permission)}
                      >
                        {permissions.includes(permission) && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {permission === "read" ? "Read memory" : "Write memory"}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Use read-only for agents that should recall context but never store new memories.</p>
                </div>

                <Button onClick={() => void handleCreateApiKey()} className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating..." : "Create Agent Key"}
                </Button>

                {generatedKey && (
                  <div className="p-4 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 rounded-lg space-y-2">
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">Agent key created — copy it now</p>
                    <div className="flex items-center gap-2">
                      <Input
                        value={showGeneratedKey ? generatedKey : "••••••••••••••••••••••••••••••••••••"}
                        readOnly
                        className="font-mono text-xs"
                      />
                      <Button variant="outline" size="sm" onClick={() => setShowGeneratedKey(!showGeneratedKey)}>
                        {showGeneratedKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => void copyToClipboard(generatedKey)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-muted-foreground">SaveMe stores only a SHA-256 hash. This raw key cannot be recovered later.</p>
                      <Button variant="outline" size="sm" onClick={() => void testGeneratedKey()} disabled={testStatus === "testing"}>
                        {testStatus === "testing" ? "Testing..." : "Test connection"}
                      </Button>
                    </div>
                    {testMessage && (
                      <p className={`text-xs ${testStatus === "success" ? "text-green-700 dark:text-green-300" : "text-red-600 dark:text-red-400"}`}>
                        {testMessage}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3">
          {apiKeys.map((apiKey) => (
            <div key={apiKey.id} className="flex items-center justify-between gap-3 p-3 border rounded-lg">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm truncate">{apiKey.name}</span>
                  <Badge variant={apiKey.is_active ? "secondary" : "outline"} className={apiKey.is_active ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : ""}>
                    {apiKey.is_active ? "Active" : "Inactive"}
                  </Badge>
                  <Badge variant="outline">{permissionLabel(apiKey.permissions)}</Badge>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Key: {apiKey.key_prefix}</p>
                  <p>Created: {formatDate(apiKey.created_at)}</p>
                  {apiKey.last_used_at && <p>Last used: {formatDate(apiKey.last_used_at)}</p>}
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => void handleDeleteApiKey(apiKey.id)} className="text-red-600 hover:text-red-700">
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}

          {apiKeys.length === 0 && (
            <div className="text-center py-6 text-muted-foreground border border-dashed rounded-lg">
              <Key className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No agent keys created yet</p>
              <p className="text-xs">Create one key per agent so users can revoke access cleanly.</p>
            </div>
          )}
        </div>

        <ConnectAgentGuide generatedKey={generatedKey} preset={activePreset} />
      </CardContent>
    </Card>
  );
};

const ConnectAgentGuide = ({ generatedKey, preset }: { generatedKey: string | null; preset: typeof AGENT_PRESETS[number] }) => {
  const snippets = buildAgentIntegrationSnippets({
    baseUrl: getCloudFunctionsBaseUrl(),
    apiKey: generatedKey,
    source: preset.source,
    presetId: preset.id,
  });
  const keyForSnippet = generatedKey || "sm_YOUR_API_KEY";
  const nodeHelperSnippet = [
    `const SAVEME_BASE_URL = process.env.SAVEME_MEMORY_BASE_URL || "${getCloudFunctionsBaseUrl()}";`,
    `const SAVEME_API_KEY = process.env.SAVEME_MEMORY_API_KEY || "${keyForSnippet}";`,
    `const SAVEME_SOURCE = process.env.SAVEME_MEMORY_SOURCE || "${preset.source}";`,
    "",
    "async function saveMe(endpoint, body = {}) {",
    "  const res = await fetch(`${SAVEME_BASE_URL}/${endpoint}`, {",
    "    method: \"POST\",",
    "    headers: {",
    "      \"Authorization\": `Bearer ${SAVEME_API_KEY}`,",
    "      \"Content-Type\": \"application/json\",",
    "    },",
    "    body: JSON.stringify(body),",
    "  });",
    "  if (!res.ok) throw new Error(`${endpoint} failed: ${res.status} ${await res.text()}`);",
    "  return res.json();",
    "}",
    "",
    "export const saveMeMemory = {",
    "  status: () => saveMe(\"sharedMemoryAgentStatus\"),",
    "  search: (query, limit = 5) => saveMe(\"sharedMemorySearch\", { query, limit, visibility: [\"shared_with_agents\"] }),",
    "  remember: ({ title, content, type = \"fact\", tags = [], project }) => saveMe(\"sharedMemoryCreate\", {",
    "    title,",
    "    content,",
    "    type,",
    "    source: SAVEME_SOURCE,",
    "    sourceAgent: SAVEME_SOURCE,",
    "    visibility: \"shared_with_agents\",",
    "    verification: \"agent_suggested\",",
    "    tags,",
    "    project,",
    "  }),",
    "};",
  ].join("\n");
  const pythonHelperSnippet = `import os, requests

SAVEME_BASE_URL = os.getenv("SAVEME_MEMORY_BASE_URL", "${getCloudFunctionsBaseUrl()}")
SAVEME_API_KEY = os.getenv("SAVEME_MEMORY_API_KEY", "${keyForSnippet}")
SAVEME_SOURCE = os.getenv("SAVEME_MEMORY_SOURCE", "${preset.source}")

def saveme(endpoint, payload=None):
    response = requests.post(
        f"{SAVEME_BASE_URL}/{endpoint}",
        headers={"Authorization": f"Bearer {SAVEME_API_KEY}", "Content-Type": "application/json"},
        json=payload or {},
        timeout=20,
    )
    response.raise_for_status()
    return response.json()

def search_memory(query, limit=5):
    return saveme("sharedMemorySearch", {"query": query, "limit": limit, "visibility": ["shared_with_agents"]})

def remember(title, content, type="fact", tags=None, project=None):
    return saveme("sharedMemoryCreate", {
        "title": title,
        "content": content,
        "type": type,
        "source": SAVEME_SOURCE,
        "sourceAgent": SAVEME_SOURCE,
        "visibility": "shared_with_agents",
        "verification": "agent_suggested",
        "tags": tags or [],
        "project": project,
    })`;

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 rounded-lg space-y-4">
      <div className="flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5" />
        <div>
          <h4 className="font-medium text-sm mb-1">Agent integration quickstart</h4>
          <p className="text-xs text-muted-foreground">
            Store these values in the agent's environment, call status to verify the connection, then use search before a run and create/update after important decisions.
          </p>
        </div>
      </div>

      <Snippet title="Environment variables" text={snippets.env} onCopy={copy} />
      <Snippet title="Agent memory instruction" text={snippets.agentInstruction} onCopy={copy} />
      <Snippet title="1. Test the connection" text={snippets.status} onCopy={copy} />
      <Snippet title="2. Write a memory" text={snippets.create} onCopy={copy} />
      <Snippet title="3. Search memory before the next run" text={snippets.search} onCopy={copy} />
      <Snippet title="Node helper for agent projects" text={nodeHelperSnippet} onCopy={copy} />
      <Snippet title="Python helper for agent projects" text={pythonHelperSnippet} onCopy={copy} />

      <div className="text-xs text-muted-foreground space-y-1">
        <p><strong>Pattern:</strong> search SaveMe at the start of each agent run, inject the results into context, then write durable preferences, decisions, facts, and project summaries back to SaveMe.</p>
        <p><strong>Endpoints:</strong> sharedMemoryAgentStatus, Create, BatchCreate, Search, List, Get, Update. All are POST with a bearer key.</p>
        {!generatedKey && <p className="italic">Create a key above to auto-fill the snippets with a real credential.</p>}
      </div>
    </div>
  );
};

const Snippet = ({ title, text, onCopy }: { title: string; text: string; onCopy: (text: string) => Promise<void> }) => (
  <div>
    <div className="flex items-center justify-between mb-1">
      <Label className="text-xs">{title}</Label>
      <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => void onCopy(text)}>
        <Copy className="w-3 h-3" />
      </Button>
    </div>
    <pre className="text-xs bg-background px-2 py-2 rounded font-mono whitespace-pre-wrap overflow-x-auto">{text}</pre>
  </div>
);
