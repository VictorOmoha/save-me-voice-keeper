
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Palette, Sun, Moon, Globe, Monitor } from "lucide-react";
import { useState } from "react";

export const AppearanceSettings = () => {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const saveThemePreference = async (newTheme: string) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const prefsRef = doc(db, 'user_preferences', user.uid);
      await setDoc(prefsRef, {
        user_id: user.uid,
        theme: newTheme,
        updated_at: serverTimestamp()
      }, { merge: true });

      toast({
        title: "Theme updated",
        description: "Your theme preference has been saved.",
      });
    } catch (error) {
      console.error('Error saving theme preference:', error);
      toast({
        title: "Error",
        description: "Failed to save theme preference.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    saveThemePreference(newTheme);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Appearance
        </CardTitle>
        <p className="text-sm text-muted-foreground">Customize the look and feel</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">Theme</p>
            <p className="text-xs text-muted-foreground">Choose your preferred theme</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={theme === "light" ? "default" : "outline"}
              size="sm"
              onClick={() => handleThemeChange("light")}
              disabled={isLoading}
            >
              <Sun className="w-4 h-4" />
            </Button>
            <Button
              variant={theme === "dark" ? "default" : "outline"} 
              size="sm"
              onClick={() => handleThemeChange("dark")}
              disabled={isLoading}
            >
              <Moon className="w-4 h-4" />
            </Button>
            <Button
              variant={theme === "system" ? "default" : "outline"} 
              size="sm"
              onClick={() => handleThemeChange("system")}
              disabled={isLoading}
            >
              <Monitor className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">Language</p>
            <p className="text-xs text-muted-foreground">Select your language</p>
          </div>
          <Badge variant="outline" className="gap-1">
            <Globe className="w-3 h-3" />
            English
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
