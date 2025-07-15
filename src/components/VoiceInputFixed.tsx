
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Volume2, AlertCircle } from "lucide-react";
import { VoiceDiagnostic } from "./VoiceDiagnostic";
import { VoiceSettingsModal } from "./VoiceSettingsModal";
import { processVoiceCommand } from "@/utils/voiceCommandProcessor";
import { toast } from "sonner";

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
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');

  const handleVoiceCommand = (transcript: string) => {
    console.log('🔊 VoiceInputFixed: Voice command received:', transcript);
    
    if (!transcript || transcript.trim().length === 0) {
      console.log('🔊 Empty transcript, ignoring');
      return;
    }
    
    const command = processVoiceCommand(transcript);
    console.log('🔊 VoiceInputFixed: Processed command:', command);
    
    // Update connection status
    setConnectionStatus('connected');
    
    // Pass the transcript to the dashboard for processing
    if (onEnhancedVoiceInput) {
      console.log('🔊 VoiceInputFixed: Calling onEnhancedVoiceInput with:', transcript);
      onEnhancedVoiceInput(transcript);
    } else {
      console.error('🔊 VoiceInputFixed: onEnhancedVoiceInput is not available!');
      toast.error('Voice input handler not available');
    }
  };

  const handleVoiceError = (error: string) => {
    console.error('🔊 VoiceInputFixed: Voice error:', error);
    setConnectionStatus('error');
    toast.error(`Voice recognition error: ${error}`);
  };

  const handleVoiceStart = () => {
    console.log('🔊 VoiceInputFixed: Voice recognition started');
    setConnectionStatus('connected');
  };

  const handleVoiceEnd = () => {
    console.log('🔊 VoiceInputFixed: Voice recognition ended');
    setConnectionStatus('disconnected');
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = () => {
    if (isVoiceProcessing) return 'Processing...';
    
    switch (connectionStatus) {
      case 'connected':
        return 'Listening';
      case 'error':
        return 'Error';
      default:
        return 'Ready';
    }
  };

  return (
    <div className="space-y-4 p-4 border border-border rounded-lg bg-card">
      {/* Header with status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()} ${connectionStatus === 'connected' ? 'animate-pulse' : ''}`} />
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Voice Commands</span>
          </div>
          
          <Badge 
            variant={connectionStatus === 'connected' ? "default" : connectionStatus === 'error' ? "destructive" : "secondary"} 
            className="text-xs"
          >
            {getStatusText()}
          </Badge>
          
          {lastVoiceCommand && (
            <Badge variant="outline" className="text-xs">
              {lastVoiceCommand.intent || lastVoiceCommand.type || 'Command'}
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

      {/* Connection status message */}
      {connectionStatus === 'error' && (
        <div className="flex items-center gap-2 p-2 bg-destructive/10 text-destructive rounded text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>Voice recognition encountered an error. Try refreshing or check your microphone permissions.</span>
        </div>
      )}

      {/* Voice diagnostic component */}
      <VoiceDiagnostic 
        onVoiceCommand={handleVoiceCommand}
        onVoiceError={handleVoiceError}
        onVoiceStart={handleVoiceStart}
        onVoiceEnd={handleVoiceEnd}
      />

      {/* Voice Settings Modal */}
      <VoiceSettingsModal 
        isOpen={showSettingsModal}
        onOpenChange={setShowSettingsModal}
      />
    </div>
  );
};
