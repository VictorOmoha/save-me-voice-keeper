import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Volume2 } from "lucide-react";
import { SimpleVoiceInput } from "./SimpleVoiceInput";
import { VoiceSettingsModal } from "./VoiceSettingsModal";
import { VoiceDiagnostic } from "./VoiceDiagnostic";
import { SimpleVoiceComponent } from "./SimpleVoiceComponent";
import { VoiceDebugTest } from "./VoiceDebugTest";
import { MicrophoneTest } from "./MicrophoneTest";
import { processVoiceCommand } from "@/utils/voiceCommandProcessor";

interface VoiceInputFixedProps {
  onEnhancedVoiceInput: (text: string) => void;
  isVoiceProcessing?: boolean;
  lastVoiceCommand?: any;
  conversationState?: 'listening' | 'confirming' | 'idle';
  hasPendingConfirmation?: boolean;
  onCancelVoice?: () => void;
  conversationData?: { isActive: boolean; currentStep?: { question: string } };
}

export const VoiceInputFixed: React.FC<VoiceInputFixedProps> = ({
  onEnhancedVoiceInput,
  isVoiceProcessing,
  lastVoiceCommand,
  conversationState,
  hasPendingConfirmation,
  onCancelVoice,
  conversationData,
}) => {
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const handleVoiceCommand = (transcript: string) => {
    console.log('🔊 VoiceInputFixed: Voice command received:', transcript);
    const command = processVoiceCommand(transcript);
    console.log('🔊 VoiceInputFixed: Processed command:', command);
    
    // Pass the transcript to the dashboard for processing
    if (onEnhancedVoiceInput) {
      console.log('🔊 VoiceInputFixed: Calling onEnhancedVoiceInput with:', transcript);
      onEnhancedVoiceInput(transcript);
    } else {
      console.error('🔊 VoiceInputFixed: onEnhancedVoiceInput is not available!');
    }
  };

  return (
    <div className="space-y-4">
      {/* Status Display */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Voice Input</span>
          {isVoiceProcessing && (
            <Badge variant="secondary" className="text-xs">
              Processing
            </Badge>
          )}
          {lastVoiceCommand && (
            <Badge variant="default" className="text-xs">
              {lastVoiceCommand.intent || 'Ready'}
            </Badge>
          )}
        </div>
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

      {/* WORKING: Voice Commands using clean implementation */}
      <div className="mb-4">
        <VoiceDiagnostic onVoiceCommand={handleVoiceCommand} />
      </div>

      {/* Voice Settings Modal */}
      <VoiceSettingsModal 
        isOpen={showSettingsModal}
        onOpenChange={setShowSettingsModal}
      />
    </div>
  );
};