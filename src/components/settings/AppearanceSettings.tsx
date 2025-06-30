
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/ThemeProvider";
import { Palette, Sun, Moon, Globe } from "lucide-react";

export const AppearanceSettings = () => {
  const { theme, setTheme } = useTheme();

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
