
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User } from "lucide-react";

interface ProfileSettingsProps {
  user: any;
}

export const ProfileSettings = ({ user }: ProfileSettingsProps) => {
  const [profile, setProfile] = useState({
    fullName: user?.name || "John Doe",
    email: user?.email || "john@example.com",
    phone: "+1 (555) 123-4567"
  });

  const handleSaveProfile = () => {
    console.log("Saving profile:", profile);
    // Add save logic here
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Profile
        </CardTitle>
        <p className="text-sm text-muted-foreground">Update your personal information</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Full Name</label>
          <Input
            value={profile.fullName}
            onChange={(e) => setProfile(prev => ({ ...prev, fullName: e.target.value }))}
            placeholder="Enter your full name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Email</label>
          <Input
            value={profile.email}
            onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
            placeholder="Enter your email"
            type="email"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">Phone</label>
          <Input
            value={profile.phone}
            onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="Enter your phone number"
          />
        </div>
        <Button onClick={handleSaveProfile} className="bg-primary text-primary-foreground hover:bg-primary/90">
          Save Changes
        </Button>
      </CardContent>
    </Card>
  );
};
