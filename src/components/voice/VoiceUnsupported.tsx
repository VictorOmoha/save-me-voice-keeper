import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export const VoiceUnsupported: React.FC = () => {
  return (
    <Card className="border-destructive">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm">
            Speech recognition not supported in this browser. 
            Please use Chrome, Edge, or Safari.
          </span>
        </div>
      </CardContent>
    </Card>
  );
};