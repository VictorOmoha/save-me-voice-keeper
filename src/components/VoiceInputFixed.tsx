
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Volume2, AlertCircle, RefreshCw, Minimize2, Maximize2, X } from "lucide-react";
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
  conversationState = 'idle',
  hasPendingConfirmation,
  onCancelVoice,
  conversationData,
}) => {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastProcessedCommand, setLastProcessedCommand] = useState<string>('');
  const [isMinimized, setIsMinimized] = useState(false);

  const handleVoiceCommand = (transcript: string) => {
    console.log('🔊 VoiceInputFixed: Voice command received:', transcript);
    
    if (!transcript || transcript.trim().length === 0) {
      console.log('🔊 Empty transcript, ignoring');
      return;
    }
    
    if (transcript === lastProcessedCommand) {
      console.log('🔊 Duplicate command, ignoring');
      return;
    }
    
    setLastProcessedCommand(transcript);
    
    const command = processVoiceCommand(transcript);
    console.log('🔊 VoiceInputFixed: Processed command:', command);
    
    setConnectionStatus('connected');
    
    if (onEnhancedVoiceInput) {
      console.log('🔊 VoiceInputFixed: Calling onEnhancedVoiceInput with:', transcript);
      onEnhancedVoiceInput(transcript);
    } else {
      console.error('🔊 VoiceInputFixed: onEnhancedVoiceInput is not available!');
      toast.error('Voice input handler not available');
    }
    
    setTimeout(() => {
      setLastProcessedCommand('');
    }, 3000);
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
    setTimeout(() => {
      setConnectionStatus('disconnected');
    }, 1000);
  };

  const handleReset = () => {
    console.log('🔊 VoiceInputFixed: Resetting voice system');
    setConnectionStatus('disconnected');
    setLastProcessedCommand('');
    toast.info('Voice system reset');
  };

  const handleCloseVoiceCommand = () => {
    console.log('🔊 VoiceInputFixed: Manual close voice command triggered');
    
    // Stop any ongoing voice recognition
    if ((window as any).__stopAllVoiceRecognition) {
      (window as any).__stopAllVoiceRecognition();
    }
    
    // Cancel any pending voice operations
    if (onCancelVoice) {
      onCancelVoice();
    }
    
    // Trigger close command via voice input
    handleVoiceCommand('close');
    
    toast.success('Voice commands cancelled');
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
    <div className="fixed bottom-4 right-4 z-50 max-w-sm transition-all duration-300 ease-in-out">
      <div className={`bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-lg transition-all duration-300 ease-in-out ${
        isMinimized ? 'w-48' : 'w-full'
      }`}>
        {/* Compact Header */}
        <div className="flex items-center justify-between p-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor()} ${connectionStatus === 'connected' ? 'animate-pulse' : ''}`} />
            <Volume2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Voice</span>
            <Badge 
              variant={connectionStatus === 'connected' ? "default" : connectionStatus === 'error' ? "destructive" : "secondary"} 
              className="text-xs"
            >
              {getStatusText()}
            </Badge>
          </div>
          
          <div className="flex gap-1">
            {/* Close Voice Command Button */}
            {(conversationState !== 'idle' || hasPendingConfirmation || isVoiceProcessing) && (
              <Button
                onClick={handleCloseVoiceCommand}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                title="Close Voice Command"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
            
            <Button
              onClick={() => setIsMinimized(!isMinimized)}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              title={isMinimized ? "Expand" : "Minimize"}
            >
              {isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
            </Button>
            
            <Button
              onClick={() => setShowSettingsModal(true)}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              title="Settings"
            >
              <Settings className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Collapsible Content */}
        {!isMinimized && (
          <div className="p-3 space-y-3">
            {/* Connection status message */}
            {connectionStatus === 'error' && (
              <div className="flex items-center gap-2 p-2 bg-destructive/10 text-destructive rounded text-xs">
                <AlertCircle className="h-3 w-3 flex-shrink-0" />
                <span>Voice error. Try resetting or check permissions.</span>
              </div>
            )}

            {/* Pending confirmation indicator */}
            {hasPendingConfirmation && (
              <div className="flex items-center gap-2 p-2 bg-blue-50 text-blue-700 rounded text-xs">
                <AlertCircle className="h-3 w-3 flex-shrink-0" />
                <span>Waiting for confirmation...</span>
                <Button onClick={handleCloseVoiceCommand} variant="outline" size="sm" className="h-6 text-xs px-2 ml-auto">
                  Cancel
                </Button>
              </div>
            )}

            {/* Active conversation indicator */}
            {(conversationState !== 'idle' || isVoiceProcessing) && (
              <div className="flex items-center justify-between p-2 bg-primary/10 text-primary rounded text-xs">
                <span>Voice command active</span>
                <Button onClick={handleCloseVoiceCommand} variant="outline" size="sm" className="h-6 text-xs px-2">
                  <X className="h-3 w-3 mr-1" />
                  Close
                </Button>
              </div>
            )}

            {/* Last command indicator */}
            {lastVoiceCommand && (
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs">
                <span className="text-muted-foreground">Last:</span>
                <Badge variant="outline" className="text-xs">
                  {lastVoiceCommand.intent || lastVoiceCommand.type || 'Command'}
                </Badge>
              </div>
            )}

            {/* Quick actions */}
            <div className="flex gap-1">
              <Button
                onClick={handleReset}
                variant="outline"
                size="sm"
                className="flex-1 h-8 text-xs"
                title="Reset voice system"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Reset
              </Button>
              
              {(conversationState !== 'idle' || hasPendingConfirmation) && (
                <Button
                  onClick={handleCloseVoiceCommand}
                  variant="destructive"
                  size="sm"
                  className="h-8 text-xs px-2"
                  title="Stop all voice commands"
                >
                  Stop
                </Button>
              )}
            </div>
          </div>
        )}

        <div className={isMinimized ? 'hidden' : 'block'}>
          <VoiceDiagnostic 
            onVoiceCommand={handleVoiceCommand}
            onVoiceError={handleVoiceError}
            onVoiceStart={handleVoiceStart}
            onVoiceEnd={handleVoiceEnd}
            compact={true}
          />
        </div>

        <VoiceSettingsModal 
          isOpen={showSettingsModal}
          onOpenChange={setShowSettingsModal}
        />
      </div>
    </div>
  );
};
