
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Sidebar } from "@/components/Sidebar";
import { 
  User, 
  Shield, 
  Bell, 
  Palette, 
  CreditCard, 
  Zap, 
  Database, 
  HelpCircle,
  Key,
  Smartphone,
  Download,
  Trash2,
  FileText,
  MessageSquare,
  Lightbulb,
  Globe,
  Moon,
  Sun
} from "lucide-react";

const Settings = () => {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState({
    fullName: user?.name || "John Doe",
    email: user?.email || "john@example.com",
    phone: "+1 (555) 123-4567"
  });
  
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    reminders: true,
    automation: false
  });

  const [theme, setTheme] = useState("light");

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleSaveProfile = () => {
    console.log("Saving profile:", profile);
    // Add save logic here
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  const handleAddEntry = () => {
    console.log("Add entry clicked from settings");
  };

  const handleCategorySelect = (categoryName: string) => {
    console.log("Category selected from settings:", categoryName);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
            <p className="text-gray-600">Manage your account preferences and application settings</p>
          </div>

          {/* Profile Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile
              </CardTitle>
              <p className="text-sm text-gray-600">Update your personal information</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <Input
                  value={profile.fullName}
                  onChange={(e) => setProfile(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <Input
                  value={profile.email}
                  onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email"
                  type="email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <Input
                  value={profile.phone}
                  onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter your phone number"
                />
              </div>
              <Button onClick={handleSaveProfile} className="bg-black text-white hover:bg-gray-800">
                Save Changes
              </Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Security Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security
                </CardTitle>
                <p className="text-sm text-gray-600">Manage your account security</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Two-Factor Authentication</p>
                    <p className="text-xs text-gray-600">Add an extra layer of security</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Enabled
                  </Badge>
                </div>
                
                <Button variant="outline" className="w-full justify-start">
                  <Key className="w-4 h-4 mr-2" />
                  Change Password
                </Button>
                
                <Button variant="outline" className="w-full justify-start">
                  <Smartphone className="w-4 h-4 mr-2" />
                  Manage Devices
                </Button>
              </CardContent>
            </Card>

            {/* Notifications Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notifications
                </CardTitle>
                <p className="text-sm text-gray-600">Configure how you receive notifications</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Email Notifications</p>
                    <p className="text-xs text-gray-600">Receive updates via email</p>
                  </div>
                  <Switch
                    checked={notifications.email}
                    onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Push Notifications</p>
                    <p className="text-xs text-gray-600">Get browser notifications</p>
                  </div>
                  <Switch
                    checked={notifications.push}
                    onCheckedChange={(checked) => handleNotificationChange('push', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Smart Reminders</p>
                    <p className="text-xs text-gray-600">Get reminded about important entries</p>
                  </div>
                  <Switch
                    checked={notifications.reminders}
                    onCheckedChange={(checked) => handleNotificationChange('reminders', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Automation Alerts</p>
                    <p className="text-xs text-gray-600">Notifications from automated workflows</p>
                  </div>
                  <Switch
                    checked={notifications.automation}
                    onCheckedChange={(checked) => handleNotificationChange('automation', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Appearance Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Appearance
                </CardTitle>
                <p className="text-sm text-gray-600">Customize the look and feel</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Theme</p>
                    <p className="text-xs text-gray-600">Choose your preferred theme</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={theme === "light" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme("light")}
                    >
                      <Sun className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={theme === "dark" ? "default" : "outline"} 
                      size="sm"
                      onClick={() => setTheme("dark")}
                    >
                      <Moon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Language</p>
                    <p className="text-xs text-gray-600">Select your language</p>
                  </div>
                  <Badge variant="outline" className="gap-1">
                    <Globe className="w-3 h-3" />
                    English
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Subscription & Billing
                </CardTitle>
                <p className="text-sm text-gray-600">Manage your subscription and billing information</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">Personal Plan</p>
                    <p className="text-xs text-gray-600">$9.99/month • Next billing: Jan 15, 2024</p>
                  </div>
                  <Badge className="bg-blue-600 text-white">Active</Badge>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Upgrade Plan
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    Billing History
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    Update Payment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Automation Section */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Automation
              </CardTitle>
              <p className="text-sm text-gray-600">Configure automation and integrations</p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium text-sm">Connected Platforms</p>
                  <p className="text-xs text-gray-600">2 platforms connected</p>
                </div>
                <Button variant="outline" size="sm">Manage</Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium text-sm">n8n</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Connected
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium text-sm">Make.com</span>
                  <Badge variant="outline">Not Connected</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Management Section */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Data Management
              </CardTitle>
              <p className="text-sm text-gray-600">Export or delete your data</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">Export Data</p>
                  <p className="text-xs text-gray-600">Download all your entries and data</p>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-red-600">Delete Account</p>
                  <p className="text-xs text-gray-600">Permanently delete your account and all data</p>
                </div>
                <Button variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Help & Support Section */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                Help & Support
              </CardTitle>
              <p className="text-sm text-gray-600">Get help and contact support</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Documentation
                </Button>
                <Button variant="outline" className="justify-start">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contact Support
                </Button>
                <Button variant="outline" className="justify-start">
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Feature Requests
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;
