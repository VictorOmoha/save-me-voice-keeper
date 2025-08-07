import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Database, Download, Trash2, Shield, Archive, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";

export const EnhancedDataManagementSettings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [storageStats, setStorageStats] = useState({
    entries: 0,
    apiKeys: 0,
    totalSize: 0,
    lastBackup: null as Date | null,
  });
  const [isExporting, setIsExporting] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);

  useEffect(() => {
    if (user) {
      loadStorageStats();
    }
  }, [user]);

  const loadStorageStats = async () => {
    if (!user) return;

    try {
      const [entriesResponse, apiKeysResponse] = await Promise.all([
        supabase.from('entries').select('id', { count: 'exact' }).eq('user_id', user.id),
        supabase.from('api_keys').select('id', { count: 'exact' }).eq('user_id', user.id),
      ]);

      setStorageStats({
        entries: entriesResponse.count || 0,
        apiKeys: apiKeysResponse.count || 0,
        totalSize: ((entriesResponse.count || 0) + (apiKeysResponse.count || 0)) * 1024, // Rough estimate
        lastBackup: null, // TODO: Implement backup tracking
      });
    } catch (error) {
      console.error('Error loading storage stats:', error);
    }
  };

  const handleExportAllData = async () => {
    if (!user) return;

    setIsExporting(true);
    try {
      // Export all user data
      const [entriesResponse, preferencesResponse, apiKeysResponse] = await Promise.all([
        supabase.from('entries').select('*').eq('user_id', user.id),
        supabase.from('user_preferences').select('*').eq('user_id', user.id),
        supabase.from('api_keys').select('id, name, key_prefix, permissions, is_active, created_at, last_used_at').eq('user_id', user.id),
      ]);

      const exportData = {
        exportDate: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email,
        },
        entries: entriesResponse.data || [],
        preferences: preferencesResponse.data?.[0] || {},
        apiKeys: apiKeysResponse.data || [],
        metadata: {
          totalEntries: entriesResponse.data?.length || 0,
          totalApiKeys: apiKeysResponse.data?.length || 0,
        }
      };

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export complete",
        description: "Your data has been exported successfully.",
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Export failed",
        description: "Failed to export your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      // Create a backup (simplified - in real app this would be more comprehensive)
      await handleExportAllData();
      setStorageStats(prev => ({ ...prev, lastBackup: new Date() }));
      
      toast({
        title: "Backup created",
        description: "Your data backup has been created and downloaded.",
      });
    } catch (error) {
      toast({
        title: "Backup failed",
        description: "Failed to create backup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    setIsDeletingAccount(true);
    try {
      // Delete all user data (the foreign key constraints will handle cascade deletes)
      const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
      
      if (authError) throw authError;

      toast({
        title: "Account deleted",
        description: "Your account and all data have been permanently deleted.",
      });

      // Sign out user
      await supabase.auth.signOut();
      
      // Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Deletion failed",
        description: "Failed to delete account. Please contact support.",
        variant: "destructive",
      });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const storageUsedPercent = Math.min((storageStats.totalSize / (10 * 1024 * 1024)) * 100, 100); // Assume 10MB limit

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Data Management
        </CardTitle>
        <p className="text-sm text-muted-foreground">Manage your data, backups, and account</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Storage Overview */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Storage Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">{storageStats.entries}</div>
              <div className="text-sm text-muted-foreground">Entries</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">{storageStats.apiKeys}</div>
              <div className="text-sm text-muted-foreground">API Keys</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">{(storageStats.totalSize / 1024).toFixed(1)}KB</div>
              <div className="text-sm text-muted-foreground">Used</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-primary">{storageUsedPercent.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Of Limit</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Storage Used</span>
              <span>{(storageStats.totalSize / 1024).toFixed(1)}KB / 10MB</span>
            </div>
            <Progress value={storageUsedPercent} className="h-2" />
          </div>
        </div>

        {/* Data Export */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Data Export</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleExportAllData}
              disabled={isExporting || storageStats.entries === 0}
              className="flex-1"
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? "Exporting..." : "Export All Data"}
            </Button>
            
            <Button
              onClick={handleCreateBackup}
              disabled={isCreatingBackup}
              variant="outline"
              className="flex-1"
            >
              <Archive className="w-4 h-4 mr-2" />
              {isCreatingBackup ? "Creating..." : "Create Backup"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Export includes all entries, settings, and API keys (excluding sensitive data).
          </p>
        </div>

        {/* Data Privacy */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Data Privacy</h3>
          <div className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">Your data is encrypted and secure</span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• All data is stored securely with encryption at rest</li>
              <li>• API keys are hashed and cannot be recovered</li>
              <li>• Voice data is processed locally when possible</li>
              <li>• You can export or delete your data at any time</li>
            </ul>
          </div>
        </div>

        {/* Account Actions */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Account Actions</h3>
          <div className="space-y-3">
            <Button
              onClick={loadStorageStats}
              variant="outline"
              className="w-full"
            >
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
                      <li>{storageStats.apiKeys} API keys</li>
                      <li>All preferences and settings</li>
                      <li>Account information</li>
                    </ul>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={isDeletingAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
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