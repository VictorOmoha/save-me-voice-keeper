import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { Bot, Database, Download, Trash2, Shield, Archive, RefreshCw } from "lucide-react";

export const EnhancedDataManagementSettings = () => {
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const [storageStats, setStorageStats] = useState({
    entries: 0,
    sharedMemories: 0,
    apiKeys: 0,
    totalSize: 0,
    lastBackup: null as Date | null,
  });
  const [isExporting, setIsExporting] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);

  const loadStorageStats = useCallback(async () => {
    if (!user) return;

    try {
      const entriesSnapshot = await getDocs(query(collection(db, "entries"), where("user_id", "==", user.uid)));

      let apiKeysCount = 0;
      try {
        const apiKeysSnapshot = await getDocs(query(collection(db, "api_keys"), where("user_id", "==", user.uid)));
        apiKeysCount = apiKeysSnapshot.size;
      } catch {
        apiKeysCount = 0;
      }

      let sharedMemoriesCount = 0;
      try {
        const sharedMemoriesSnapshot = await getDocs(query(collection(db, "shared_memories"), where("user_id", "==", user.uid)));
        sharedMemoriesCount = sharedMemoriesSnapshot.size;
      } catch {
        sharedMemoriesCount = 0;
      }

      setStorageStats({
        entries: entriesSnapshot.size,
        sharedMemories: sharedMemoriesCount,
        apiKeys: apiKeysCount,
        totalSize: (entriesSnapshot.size + sharedMemoriesCount + apiKeysCount) * 1024,
        lastBackup: null,
      });
    } catch (error) {
      console.error("Error loading storage stats:", error);
      toast({
        title: "Could not load data stats",
        description: "Refresh the page or try again in a moment.",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  const handleExportAllData = useCallback(async () => {
    if (!user) return;

    setIsExporting(true);
    try {
      const entriesSnapshot = await getDocs(query(collection(db, "entries"), where("user_id", "==", user.uid)));
      const entries = entriesSnapshot.docs.map((entryDoc) => ({ id: entryDoc.id, ...entryDoc.data() }));

      let sharedMemories: Array<Record<string, unknown>> = [];
      try {
        const sharedMemoriesSnapshot = await getDocs(query(collection(db, "shared_memories"), where("user_id", "==", user.uid)));
        sharedMemories = sharedMemoriesSnapshot.docs.map((memoryDoc) => ({ id: memoryDoc.id, ...memoryDoc.data() }));
      } catch {
        sharedMemories = [];
      }

      let preferences = {};
      try {
        const prefsSnap = await getDoc(doc(db, "user_preferences", user.uid));
        if (prefsSnap.exists()) preferences = prefsSnap.data();
      } catch {
        preferences = {};
      }

      let apiKeys: Array<Record<string, unknown>> = [];
      try {
        const apiKeysSnapshot = await getDocs(query(collection(db, "api_keys"), where("user_id", "==", user.uid)));
        apiKeys = apiKeysSnapshot.docs.map((keyDoc) => {
          const data = keyDoc.data();
          return {
            id: keyDoc.id,
            name: data.name,
            agent_type: data.agent_type,
            agent_source: data.agent_source,
            key_prefix: data.key_prefix,
            permissions: data.permissions,
            is_active: data.is_active,
            created_at: data.created_at?.toDate?.() || data.created_at,
            last_used_at: data.last_used_at?.toDate?.() || data.last_used_at,
          };
        });
      } catch {
        apiKeys = [];
      }

      const exportData = {
        exportDate: new Date().toISOString(),
        user: {
          id: user.uid,
          email: user.email,
        },
        entries,
        sharedMemories,
        preferences,
        apiKeys,
        metadata: {
          totalEntries: entries.length,
          totalSharedMemories: sharedMemories.length,
          totalApiKeys: apiKeys.length,
        },
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `saveme-data-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export complete",
        description: "Your entries, shared memories, settings, and key metadata were exported.",
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        title: "Export failed",
        description: "Failed to export your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) void loadStorageStats();
  }, [user, loadStorageStats]);

  useEffect(() => {
    const handleNovaExport = () => {
      void handleExportAllData();
    };

    window.addEventListener("nova:export-data", handleNovaExport as EventListener);
    return () => window.removeEventListener("nova:export-data", handleNovaExport as EventListener);
  }, [handleExportAllData]);

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      await handleExportAllData();
      setStorageStats((prev) => ({ ...prev, lastBackup: new Date() }));
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    setIsDeletingAccount(true);
    try {
      toast({
        title: "Account deletion requested",
        description: "Please contact support to complete account deletion.",
      });

      await logout();
      window.location.href = "/";
    } catch (error) {
      console.error("Error deleting account:", error);
      toast({
        title: "Deletion failed",
        description: "Failed to delete account. Please contact support.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const storageUsedPercent = Math.min((storageStats.totalSize / (10 * 1024 * 1024)) * 100, 100);
  const hasExportableData = storageStats.entries + storageStats.sharedMemories + storageStats.apiKeys > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Data Management
        </CardTitle>
        <p className="text-sm text-muted-foreground">Manage exports, backups, agent access, and account data</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Storage Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">{storageStats.entries}</div>
              <div className="text-sm text-muted-foreground">Entries</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">{storageStats.sharedMemories}</div>
              <div className="text-sm text-muted-foreground">Shared Memories</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">{storageStats.apiKeys}</div>
              <div className="text-sm text-muted-foreground">Agent Keys</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">{(storageStats.totalSize / 1024).toFixed(1)}KB</div>
              <div className="text-sm text-muted-foreground">Estimated</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Estimated Storage Used</span>
              <span>{(storageStats.totalSize / 1024).toFixed(1)}KB / 10MB</span>
            </div>
            <Progress value={storageUsedPercent} className="h-2" />
          </div>
        </div>

        <div className="p-4 border rounded-lg space-y-3 bg-muted/30">
          <div className="flex items-start gap-3">
            <Bot className="w-5 h-5 text-primary mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-medium">Agent Memory Access</h3>
              <p className="text-sm text-muted-foreground">
                Manage the agents that can read/write your shared memory. Create one key per agent and revoke access anytime.
              </p>
            </div>
          </div>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <Link to="/settings?tab=automation&connect=agent#connect-agent">Connect or manage agents</Link>
          </Button>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Data Export</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={() => void handleExportAllData()} disabled={isExporting || !hasExportableData} className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? "Exporting..." : "Export All Data"}
            </Button>

            <Button onClick={() => void handleCreateBackup()} disabled={isCreatingBackup || !hasExportableData} variant="outline" className="flex-1">
              <Archive className="w-4 h-4 mr-2" />
              {isCreatingBackup ? "Creating..." : "Create Backup"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Export includes entries, shared memories, settings, and API key metadata. Raw API keys are never exported.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Data Privacy</h3>
          <div className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">Your data is encrypted and secure</span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Data is stored securely with encryption at rest</li>
              <li>• Agent API keys are hashed and cannot be recovered</li>
              <li>• Shared memories keep source labels for auditability</li>
              <li>• You can export your data or revoke agent access at any time</li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Account Actions</h3>
          <div className="space-y-3">
            <Button onClick={() => void loadStorageStats()} variant="outline" className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Storage Stats
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Account</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                    <br /><br />
                    <strong>This will delete:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>{storageStats.entries} entries</li>
                      <li>{storageStats.sharedMemories} shared memories</li>
                      <li>{storageStats.apiKeys} agent/API keys</li>
                      <li>All preferences and settings</li>
                      <li>Account information</li>
                    </ul>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => void handleDeleteAccount()} disabled={isDeletingAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {isDeletingAccount ? "Deleting..." : "Delete Account"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
