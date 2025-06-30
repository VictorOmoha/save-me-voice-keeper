
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { SecuritySettings } from "@/components/settings/SecuritySettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { AppearanceSettings } from "@/components/settings/AppearanceSettings";
import { SubscriptionSettings } from "@/components/settings/SubscriptionSettings";
import { AutomationSettings } from "@/components/settings/AutomationSettings";
import { DataManagementSettings } from "@/components/settings/DataManagementSettings";
import { HelpSupportSettings } from "@/components/settings/HelpSupportSettings";

const Settings = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleAddEntry = () => {
    console.log("Add entry clicked from settings");
  };

  const handleCategorySelect = (categoryName: string) => {
    console.log("Category selected from settings:", categoryName);
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar 
        savedEntriesCount={42}
        onAddEntry={handleAddEntry}
        onCategorySelect={handleCategorySelect}
      />
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto py-8 px-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
            <p className="text-muted-foreground">Manage your account preferences and application settings</p>
          </div>

          {/* Profile Section */}
          <ProfileSettings user={user} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Security Section */}
            <SecuritySettings />

            {/* Notifications Section */}
            <NotificationSettings />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Appearance Section */}
            <AppearanceSettings />

            {/* Subscription Section */}
            <SubscriptionSettings />
          </div>

          {/* Automation Section */}
          <AutomationSettings />

          {/* Data Management Section */}
          <DataManagementSettings />

          {/* Help & Support Section */}
          <HelpSupportSettings />
        </div>
      </div>
    </div>
  );
};

export default Settings;
