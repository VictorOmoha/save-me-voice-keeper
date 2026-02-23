
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import { User as FirebaseUser } from "firebase/auth";

interface ProfileSettingsProps {
  user: FirebaseUser | null;
}

export const ProfileSettings = ({ user }: ProfileSettingsProps) => {
  const [profile, setProfile] = useState({
    fullName: user?.displayName || "",
    email: user?.email || "",
    phone: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveProfile = async () => {
    if (!user?.uid) {
      toast.error("User not found");
      return;
    }

    setIsLoading(true);
    try {
      const profileRef = doc(db, 'profiles', user.uid);
      await setDoc(profileRef, {
        id: user.uid,
        full_name: profile.fullName,
        email: profile.email,
        phone: profile.phone,
        updated_at: serverTimestamp()
      }, { merge: true });

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
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
        <Button 
          onClick={handleSaveProfile} 
          disabled={isLoading}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </CardContent>
    </Card>
  );
};
