import React from "react";
import { VoiceSettingsForm } from "./VoiceSettingsForm";
import { Card, CardContent } from "@/components/ui/card";

export const EnhancedVoiceSettings = () => {
  return (
    <div className="space-y-6">
      <VoiceSettingsForm showTitle={false} />
    </div>
  );
};