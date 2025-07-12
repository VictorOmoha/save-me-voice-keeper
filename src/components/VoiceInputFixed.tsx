import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Settings, Volume2 } from "lucide-react";
import { VoiceInput } from "./VoiceInput";
import { EnhancedVoiceInput } from "./EnhancedVoiceInput";
import { VoiceSettingsModal } from "./VoiceSettingsModal";

interface VoiceInputFixedProps {
  onEnhancedVoiceInput: (text: string) => void;
  isVoiceProcessing?: boolean;
  lastVoiceCommand?: any;
  conversationState?: 'listening' | 'confirming' | 'idle';
  hasPendingConfirmation?: boolean;
  onCancelVoice?: () => void;
}

export const VoiceInputFixed: React.FC<VoiceInputFixedProps> = ({
  onEnhancedVoiceInput,
  isVoiceProcessing,
  lastVoiceCommand,
  conversationState,
  hasPendingConfirmation,
  onCancelVoice,
}) => {
  const [useEnhanced, setUseEnhanced] = useState(true);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  return (
    <div className="space-y-4">
      {/* Voice Input Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Voice Input</span>
          {lastVoiceCommand && (
            <Badge variant="secondary" className="text-xs">
              {lastVoiceCommand.intent || 'processing'}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setUseEnhanced(!useEnhanced)}
            variant="outline"
            size="sm"
            className="text-xs"
          >
            {useEnhanced ? 'Enhanced' : 'Basic'}
          </Button>
          <Button
            onClick={() => setShowSettingsModal(true)}
            variant="ghost"
            size="sm"
            className="text-xs"
          >
            <Settings className="h-3 w-3 mr-1" />
            Settings
          </Button>
        </div>
      </div>

      {/* Voice Input Component */}
      {useEnhanced ? (
        <EnhancedVoiceInput
          onVoiceInput={onEnhancedVoiceInput}
          isProcessing={isVoiceProcessing || false}
          lastCommand={lastVoiceCommand}
          conversationState={conversationState || 'idle'}
          hasPendingConfirmation={hasPendingConfirmation || false}
          onCancel={onCancelVoice || (() => {})}
        />
      ) : (
        <VoiceInput 
          onEnhancedVoiceInput={onEnhancedVoiceInput}
        />
      )}

      {/* Voice Settings Modal */}
      <VoiceSettingsModal 
        isOpen={showSettingsModal}
        onOpenChange={setShowSettingsModal}
      />
    </div>
  );
};