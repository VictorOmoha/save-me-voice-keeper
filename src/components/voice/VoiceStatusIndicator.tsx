
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Volume2, AlertCircle } from "lucide-react";

interface VoiceStatusIndicatorProps {
  connectionStatus: 'connected' | 'disconnected' | 'error';
  isVoiceProcessing: boolean;
  conversationState?: 'listening' | 'confirming' | 'idle';
  hasPendingConfirmation?: boolean;
}

export const VoiceStatusIndicator: React.FC<VoiceStatusIndicatorProps> = ({
  connectionStatus,
  isVoiceProcessing,
  conversationState = 'idle',
  hasPendingConfirmation = false,
}) => {
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

  const getBadgeVariant = () => {
    if (connectionStatus === 'connected') return "default";
    if (connectionStatus === 'error') return "destructive";
    return "secondary";
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${getStatusColor()} ${connectionStatus === 'connected' ? 'animate-pulse' : ''}`} />
      <Volume2 className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-medium">Voice</span>
      <Badge variant={getBadgeVariant()} className="text-xs">
        {getStatusText()}
      </Badge>
      
      {hasPendingConfirmation && (
        <div className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3 text-blue-500" />
          <Badge variant="outline" className="text-xs">
            Waiting
          </Badge>
        </div>
      )}
      
      {conversationState === 'listening' && !hasPendingConfirmation && (
        <Badge variant="default" className="text-xs animate-pulse">
          Active
        </Badge>
      )}
    </div>
  );
};
