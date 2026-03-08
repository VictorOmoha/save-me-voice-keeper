
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useSearchParams } from "react-router-dom";
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
import { NovaMemorySettings } from "@/components/settings/NovaMemorySettings";
import { VideoUpload } from "@/components/admin/VideoUpload";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft, User, Shield, Bell, Palette, Zap, CreditCard, HelpCircle, Video, Mic, Database, Brain } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

const Settings = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("profile");
  const [isAdmin, setIsAdmin] = useState(false);

  // Load saved entries for data management
  const [savedEntries, setSavedEntries] = useState<unknown[]>([]);

  // Check if user has admin role
  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) return;
      try {
        const roleRef = doc(db, 'user_roles', user.uid);
        const roleSnap = await getDoc(roleRef);
        if (roleSnap.exists()) {
          setIsAdmin(roleSnap.data()?.role === 'admin');
        }
      } catch (error) {
        console.log('Could not check admin role:', error);
      }
    };
    checkAdminRole();
  }, [user]);

  useEffect(() => {
    const entries = localStorage.getItem('savedEntries');
    if (entries) {
      setSavedEntries(JSON.parse(entries));
    }
  }, []);

  useEffect(() => {
    const requestedTab = searchParams.get('tab');
    if (requestedTab) {
      setActiveTab(requestedTab);
    }
  }, [searchParams]);

  useEffect(() => {
    const handleSettingsUpdated = (e: Event) => {
      const event = e as CustomEvent<{ setting?: string }>;
      const setting = event.detail?.setting;

      if (setting === 'profile') setActiveTab('profile');
      else if (setting === 'voice') setActiveTab('voice');
      else if (setting && setting.includes('notification')) setActiveTab('notifications');
      else if (setting && setting.includes('automation')) setActiveTab('notifications');
      else setActiveTab((prev) => prev || 'profile');
    };

    const handleNovaExport = () => {
      setActiveTab('data-management');
    };

    window.addEventListener('nova:settings-updated', handleSettingsUpdated as EventListener);
    window.addEventListener('nova:export-data', handleNovaExport);

    return () => {
      window.removeEventListener('nova:settings-updated', handleSettingsUpdated as EventListener);
      window.removeEventListener('nova:export-data', handleNovaExport);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Grid Blueprint Background */}
      <div className="grid-blueprint" />

      <div className="container mx-auto px-4 py-8 max-w-4xl relative">
        {/* Header - Skeletal */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="protocol-tag mb-3">PROTOCOL: CONFIGURATION</div>
            <h1 className="archive-title text-2xl mb-1">SETTINGS</h1>
            <p className="mono text-xs text-muted-foreground">MANAGE YOUR ACCOUNT AND PREFERENCES</p>
          </div>
          <Link to="/dashboard" className="btn-galvanized btn-galvanized-secondary">
            <ArrowLeft className="w-4 h-4" />
            DASHBOARD
          </Link>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="flex gap-8">
          {/* Settings Navigation - Skeletal */}
          <div className="galvanized-card p-4 h-fit w-64">
            <TabsList className="flex flex-col h-fit w-full bg-transparent p-0 gap-1">
              <TabsTrigger value="profile" className="nav-item-skeletal w-full justify-start data-[state=active]:active">
                <User className="w-4 h-4" />
                PROFILE
              </TabsTrigger>
              <TabsTrigger value="security" className="nav-item-skeletal w-full justify-start data-[state=active]:active">
                <Shield className="w-4 h-4" />
                SECURITY
              </TabsTrigger>
              <TabsTrigger value="notifications" className="nav-item-skeletal w-full justify-start data-[state=active]:active">
                <Bell className="w-4 h-4" />
                NOTIFICATIONS
              </TabsTrigger>
              <TabsTrigger value="appearance" className="nav-item-skeletal w-full justify-start data-[state=active]:active">
                <Palette className="w-4 h-4" />
                APPEARANCE
              </TabsTrigger>
              <TabsTrigger value="voice" className="nav-item-skeletal w-full justify-start data-[state=active]:active">
                <Mic className="w-4 h-4" />
                VOICE_SETTINGS
              </TabsTrigger>
              <TabsTrigger value="nova-memory" className="nav-item-skeletal w-full justify-start data-[state=active]:active">
                <Brain className="w-4 h-4" />
                NOVA_MEMORY
              </TabsTrigger>
              <TabsTrigger value="automation" className="nav-item-skeletal w-full justify-start data-[state=active]:active">
                <Zap className="w-4 h-4" />
                AUTOMATION_API
              </TabsTrigger>
              <TabsTrigger value="subscription" className="nav-item-skeletal w-full justify-start data-[state=active]:active">
                <CreditCard className="w-4 h-4" />
                SUBSCRIPTION
              </TabsTrigger>
              <TabsTrigger value="data-management" className="nav-item-skeletal w-full justify-start data-[state=active]:active">
                <Database className="w-4 h-4" />
                DATA_MANAGEMENT
              </TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="admin-videos" className="nav-item-skeletal w-full justify-start data-[state=active]:active">
                  <Video className="w-4 h-4" />
                  DEMO_VIDEOS
                </TabsTrigger>
              )}
              <TabsTrigger value="help" className="nav-item-skeletal w-full justify-start data-[state=active]:active">
                <HelpCircle className="w-4 h-4" />
                HELP_SUPPORT
              </TabsTrigger>
            </TabsList>
          </div>

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
            <TabsContent value="nova-memory">
              <NovaMemorySettings />
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
            {isAdmin && (
              <TabsContent value="admin-videos">
                <VideoUpload />
              </TabsContent>
            )}
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
