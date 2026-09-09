import {WorkspacePage, WorkspacePageHeader} from '@/components/workspace/WorkspacePage';

import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useSearchParams } from "react-router-dom";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { SecuritySettings } from "@/components/settings/SecuritySettings";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { AppearanceSettings } from "@/components/settings/AppearanceSettings";
import { SubscriptionSettings } from "@/components/settings/SubscriptionSettings";
import { AutomationSettings } from "@/components/settings/AutomationSettings";
import { EnhancedDataManagementSettings } from "@/components/settings/EnhancedDataManagementSettings";
import { VoiceSettings } from "@/components/settings/VoiceSettings";
import { EnhancedHelpSupportSettings } from "@/components/settings/EnhancedHelpSupportSettings";
import { NovaMemorySettings } from "@/components/settings/NovaMemorySettings";
import { ExtensionSettings } from "@/components/settings/ExtensionSettings";
import { VideoUpload } from "@/components/admin/VideoUpload";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowLeft, User, Shield, Bell, Palette, Zap, CreditCard, HelpCircle, Video, Mic, Database, Brain } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

const settingsSections = [
  {value: 'profile', label: 'Profile', icon: User},
  {value: 'security', label: 'Security', icon: Shield},
  {value: 'notifications', label: 'Notifications', icon: Bell},
  {value: 'appearance', label: 'Appearance', icon: Palette},
  {value: 'voice', label: 'Voice', icon: Mic},
  {value: 'nova-memory', label: 'Nova memory', icon: Brain},
  {value: 'automation', label: 'Automation & API', icon: Zap},
  {value: 'subscription', label: 'Plan & billing', icon: CreditCard},
  {value: 'data-management', label: 'Your data', icon: Database},
  {value: 'help', label: 'Help & support', icon: HelpCircle},
  {value: 'admin-videos', label: 'Demo videos', icon: Video},
];

const Settings = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("profile");
  const [isAdmin, setIsAdmin] = useState(false);

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
      } catch {
        setIsAdmin(false);
      }
    };
    checkAdminRole();
  }, [user]);

  useEffect(() => {
    const requestedTab = searchParams.get('tab');
    if (requestedTab && settingsSections.some(section => section.value === requestedTab)) {
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
      else if (setting && setting.includes('automation')) setActiveTab('automation');
      else setActiveTab((prev) => prev || 'profile');
    };

    const handleNovaExport = () => {
      setActiveTab('data-management');
    };

    const handleOpenSettingsTab = (e: Event) => {
      const event = e as CustomEvent<{ tab?: string }>;
      if (event.detail?.tab && settingsSections.some(section => section.value === event.detail.tab)) setActiveTab(event.detail.tab);
    };

    window.addEventListener('nova:settings-updated', handleSettingsUpdated as EventListener);
    window.addEventListener('nova:export-data', handleNovaExport);
    window.addEventListener('saveme:open-settings-tab', handleOpenSettingsTab as EventListener);

    return () => {
      window.removeEventListener('nova:settings-updated', handleSettingsUpdated as EventListener);
      window.removeEventListener('nova:export-data', handleNovaExport);
      window.removeEventListener('saveme:open-settings-tab', handleOpenSettingsTab as EventListener);
    };
  }, []);

  const availableSections = settingsSections.filter(section => section.value !== 'admin-videos' || isAdmin);
  const visibleTab = availableSections.some(section => section.value === activeTab) ? activeTab : 'profile';
  const changeSection = (value: string) => { setActiveTab(value); setSearchParams({tab: value}, {replace: true}); };
  return <WorkspacePage>
    <WorkspacePageHeader title="Settings" description="Make SaveMe work for you. Manage your profile, voice, privacy, and preferences." />
    {window.location.hash === '#connect-extension' && <div className="mb-6"><ExtensionSettings /></div>}
    <Tabs value={visibleTab} onValueChange={changeSection} orientation="vertical" className="flex flex-col gap-6 xl:flex-row">
      <div className="xl:hidden space-y-2">
        <label htmlFor="settings-section" className="text-sm font-medium">Settings section</label>
        <select id="settings-section" value={visibleTab} onChange={event => changeSection(event.target.value)} className="workspace-select w-full">
          {availableSections.map(section => <option key={section.value} value={section.value}>{section.label}</option>)}
        </select>
      </div>
      <TabsList aria-label="Settings sections" className="hidden xl:flex h-fit w-52 shrink-0 flex-col items-stretch gap-1 rounded-xl border border-border/60 bg-card p-2">
        {availableSections.map(({value, label, icon: Icon}) => <TabsTrigger key={value} value={value}
          className="min-h-11 justify-start gap-3 px-3 text-sm text-muted-foreground data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none">
          <Icon className="h-4 w-4" />{label}
        </TabsTrigger>)}
      </TabsList>
          <div className="min-w-0 flex-1 settings-content">
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
  </WorkspacePage>;
};
export default Settings;
