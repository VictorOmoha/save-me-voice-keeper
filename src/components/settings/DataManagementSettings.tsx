
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Database, Download, Trash2, FileText } from "lucide-react";
import { exportToCSV } from "@/utils/csvExport";
import { SavedEntry } from "@/pages/Dashboard";
import { toast } from "sonner";
import { useState } from "react";

interface DataManagementSettingsProps {
  savedEntries?: SavedEntry[];
}

export const DataManagementSettings: React.FC<DataManagementSettingsProps> = ({ 
  savedEntries = [] 
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCSV = async () => {
    if (savedEntries.length === 0) {
      toast.error("No data to export");
      return;
    }

    setIsExporting(true);
    try {
      exportToCSV(savedEntries, 'all-form-data');
      toast.success(`Exported ${savedEntries.length} entries to CSV`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Data Management
        </CardTitle>
        <p className="text-sm text-muted-foreground">Export or delete your data</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">Export to CSV</p>
            <p className="text-xs text-muted-foreground">
              Download all your form data as a CSV file ({savedEntries.length} entries)
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExportCSV}
            disabled={isExporting || savedEntries.length === 0}
          >
            <FileText className="w-4 h-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </Button>
        </div>
        
        <Separator />
        
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">Export Data</p>
            <p className="text-xs text-muted-foreground">Download all your entries and data</p>
          </div>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
        
        <Separator />
        
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm text-red-600 dark:text-red-400">Delete Account</p>
            <p className="text-xs text-muted-foreground">Permanently delete your account and all data</p>
          </div>
          <Button variant="destructive" size="sm">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Account
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
