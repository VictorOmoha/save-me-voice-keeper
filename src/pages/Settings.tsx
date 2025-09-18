
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { SecuritySettings } from "@/components/settings/SecuritySettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { AppearanceSettings } from "@/components/settings/AppearanceSettings";
import { SubscriptionSettings } from "@/components/settings/SubscriptionSettings";
import { AutomationSettings } from "@/components/settings/AutomationSettings";
import { DataManagementSettings } from "@/components/settings/DataManagementSettings";
import { HelpSupportSettings } from "@/components/settings/HelpSupportSettings";
import { VoiceSettings } from "@/components/settings/VoiceSettings";
import { EnhancedVoiceSettings } from "@/components/settings/EnhancedVoiceSettings";
import { EnhancedHelpSupportSettings } from "@/components/settings/EnhancedHelpSupportSettings";
import { EnhancedDataManagementSettings } from "@/components/settings/EnhancedDataManagementSettings";
import { VideoUpload } from "@/components/admin/VideoUpload";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft, User, Shield, Bell, Palette, Zap, CreditCard, HelpCircle, Video, Mic, Database } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useState, useEffect } from "react";

const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  
  // Load saved entries for data management
  const [savedEntries, setSavedEntries] = useState<any[]>([]);
  
  useEffect(() => {
    const entries = localStorage.getItem('savedEntries');
    if (entries) {
      setSavedEntries(JSON.parse(entries));
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your account and preferences</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="flex gap-8">
          <TabsList className="flex flex-col h-fit w-64 p-1">
            <TabsTrigger value="profile" className="w-full justify-start">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="w-full justify-start">
              <Shield className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="notifications" className="w-full justify-start">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="appearance" className="w-full justify-start">
              <Palette className="w-4 h-4 mr-2" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="voice" className="w-full justify-start">
              <Mic className="w-4 h-4 mr-2" />
              Voice Settings
            </TabsTrigger>
            <TabsTrigger value="automation" className="w-full justify-start">
              <Zap className="w-4 h-4 mr-2" />
              Automation & API
            </TabsTrigger>
            <TabsTrigger value="subscription" className="w-full justify-start">
              <CreditCard className="w-4 h-4 mr-2" />
              Subscription
            </TabsTrigger>
            <TabsTrigger value="data-management" className="w-full justify-start">
              <Database className="w-4 h-4 mr-2" />
              Data Management
            </TabsTrigger>
            <TabsTrigger value="admin-videos" className="w-full justify-start">
              <Video className="w-4 h-4 mr-2" />
              Demo Videos
            </TabsTrigger>
            <TabsTrigger value="help" className="w-full justify-start">
              <HelpCircle className="w-4 h-4 mr-2" />
              Help & Support
            </TabsTrigger>
          </TabsList>

          <div className="flex-1">
            <TabsContent value="profile">
              <ProfileSettings user={user} />
            </TabsContent>
            <TabsContent value="security">
              <SecuritySettings />
            </TabsContent>
            <TabsContent value="notifications">
              <NotificationSettings />
            </TabsContent>
            <TabsContent value="appearance">
              <AppearanceSettings />
            </TabsContent>
            <TabsContent value="voice">
              <VoiceSettings />
            </TabsContent>
            <TabsContent value="automation">
              <AutomationSettings />
            </TabsContent>
            <TabsContent value="subscription">
              <SubscriptionSettings />
            </TabsContent>
            <TabsContent value="data-management">
              <EnhancedDataManagementSettings />
            </TabsContent>
            <TabsContent value="admin-videos">
              <VideoUpload />
            </TabsContent>
            <TabsContent value="help">
              <EnhancedHelpSupportSettings />
            </TabsContent>
          </div>
        </Tabs>

        
      </div>
    </div>
  );
};

export default Settings;
