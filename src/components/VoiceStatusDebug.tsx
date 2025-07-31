import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Mic, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface VoiceStatusDebugProps {
  isListening?: boolean;
  conversationState?: 'listening' | 'confirming' | 'idle';
  hasPendingConfirmation?: boolean;
  lastCommand?: string;
  debugMode?: boolean;
}

export const VoiceStatusDebug: React.FC<VoiceStatusDebugProps> = ({
  isListening = false,
  conversationState = 'idle',
  hasPendingConfirmation = false,
  lastCommand = '',
  debugMode = false
}) => {
  if (!debugMode) return null;

  const getStatusColor = () => {
    if (hasPendingConfirmation) return 'destructive';
    if (isListening) return 'default';
    return 'secondary';
  };

  const getStatusIcon = () => {
    if (hasPendingConfirmation) return <Clock className="w-3 h-3" />;
    if (isListening) return <Mic className="w-3 h-3" />;
    return <CheckCircle className="w-3 h-3" />;
  };

  const getStatusText = () => {
    if (hasPendingConfirmation) return 'Waiting for confirmation';
    if (isListening) return 'Listening';
    if (conversationState === 'confirming') return 'Processing confirmation';
    return 'Ready';
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <Badge variant={getStatusColor()} className="flex items-center gap-2">
        {getStatusIcon()}
        {getStatusText()}
      </Badge>
      
      {lastCommand && (
        <div className="bg-background/90 border rounded-md p-2 text-xs max-w-xs">
          <div className="font-medium">Last Command:</div>
          <div className="text-muted-foreground truncate">{lastCommand}</div>
        </div>
      )}
      
      {hasPendingConfirmation && (
        <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-md p-2 text-xs">
          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
            <AlertCircle className="w-3 h-3" />
            <span className="font-medium">Say "yes" to confirm or "no" to cancel</span>
          </div>
          <div className="text-orange-500 dark:text-orange-300 mt-1">
            Or say "start over" to reset
          </div>
        </div>
      )}
    </div>
  );
};