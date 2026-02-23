
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Shield, Key, Smartphone } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { auth } from "@/lib/firebase";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { toast } from "sonner";

export const SecuritySettings = () => {
  const { user } = useAuth();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    // Strong password validation: minimum 8 characters with complexity
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passwordRegex.test(passwordForm.newPassword)) {
      toast.error("Password must be at least 8 characters with uppercase, lowercase, number, and special character");
      return;
    }

    if (!user || !user.email) {
      toast.error("No authenticated user");
      return;
    }

    setIsLoading(true);
    try {
      // Need to get the actual Firebase User object for reauthentication
      const firebaseUser = auth.currentUser;
      if (!firebaseUser || !firebaseUser.email) {
        throw new Error("No authenticated user");
      }

      // Re-authenticate user before password change
      const credential = EmailAuthProvider.credential(firebaseUser.email, passwordForm.currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);

      // Update password
      await updatePassword(firebaseUser, passwordForm.newPassword);

      toast.success("Password updated successfully");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setIsPasswordDialogOpen(false);
    } catch (error) {
      console.error('Error updating password:', error);
      const errorCode = error instanceof Error && "code" in error ? (error as { code?: string }).code : undefined;
      if (errorCode === 'auth/wrong-password') {
        toast.error("Current password is incorrect");
      } else {
        toast.error("Failed to update password");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Security
        </CardTitle>
        <p className="text-sm text-muted-foreground">Manage your account security</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div>
            <p className="font-medium text-sm">Two-Factor Authentication</p>
            <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
          </div>
          <Badge variant="outline" className="text-muted-foreground">
            Coming Soon
          </Badge>
        </div>

        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full justify-start">
              <Key className="w-4 h-4 mr-2" />
              Change Password
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Current Password</label>
                <Input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">New Password</label>
                <Input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                <Input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm new password"
                />
              </div>
              <Button
                onClick={handleChangePassword}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Button variant="outline" className="w-full justify-start" onClick={() => toast.info("Device management coming soon")}>
          <Smartphone className="w-4 h-4 mr-2" />
          Manage Devices
        </Button>
      </CardContent>
    </Card>
  );
};
