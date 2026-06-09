
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, Calendar, Loader2, FileJson, FileSpreadsheet, ExternalLink } from "lucide-react";
import { useUserPreferences, UserPreferences } from "@/hooks/useUserPreferences";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";

export const ExportSettings: React.FC = () => {
  const { preferences, updatePreferences, isLoading } = useUserPreferences();
  const exportPreferences = preferences;
  const [isExporting, setIsExporting] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);

  const handleUpdatePreference = async (updates: Partial<UserPreferences>) => {
    const success = await updatePreferences(updates);
    if (!success) {
      toast.error("Failed to update settings");
    }
  };

  const triggerManualExport = async () => {
    const cloudFunctionsUrl = import.meta.env.VITE_CLOUD_FUNCTIONS_URL;
    if (!cloudFunctionsUrl) {
      toast.error("Export service not configured");
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      toast.error("Please sign in to export data");
      return;
    }

    setIsExporting(true);
    setExportUrl(null);

    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(`${cloudFunctionsUrl}/triggerExport`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ format: exportPreferences.auto_export_format || "json" }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Export failed");
      }

      if (data.url) {
        setExportUrl(data.url);
        toast.success(`Exported ${data.entryCount} entries`);
      } else {
        toast.info(data.message || "No entries to export");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error((error as Error).message || "Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5 text-primary" />
          Data Export
        </CardTitle>
        <CardDescription>
          Configure automatic backups and export your data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Manual Export */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Export Format</Label>
          <Select
            value={exportPreferences.auto_export_format || "json"}
            onValueChange={(value) => handleUpdatePreference({ auto_export_format: value as "json" | "csv" })}
            disabled={isLoading}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="json">
                <div className="flex items-center gap-2">
                  <FileJson className="h-4 w-4" />
                  <span>JSON (Full data with all fields)</span>
                </div>
              </SelectItem>
              <SelectItem value="csv">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>CSV (Spreadsheet compatible)</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            onClick={triggerManualExport}
            disabled={isExporting || isLoading}
            className="w-full"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export All Data Now
              </>
            )}
          </Button>

          {exportUrl && (
            <a
              href={exportUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              Download your export file
            </a>
          )}
        </div>

        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Label>Automatic Daily Backup</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Automatically export your new entries every 24 hours
              </p>
            </div>
            <Switch
              checked={exportPreferences.auto_export_enabled || false}
              onCheckedChange={(checked) => handleUpdatePreference({ auto_export_enabled: checked })}
              disabled={isLoading}
            />
          </div>

          {exportPreferences.auto_export_enabled && (
            <div className="p-3 bg-primary/5 border border-primary/20 text-sm text-muted-foreground">
              Auto-backup is enabled. Your new entries will be exported daily and stored securely in your account.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
