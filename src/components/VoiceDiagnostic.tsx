
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, MicOff, Volume2, VolumeX, Trash2, Play, Pause, Activity } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { toast } from "sonner";
import { logVoice } from "@/utils/logger";

interface VoiceDiagnosticProps {
  onVoiceCommand?: (transcript: string) => void;
  onVoiceError?: (error: string) => void;
  onVoiceStart?: () => void;
  onVoiceEnd?: () => void;
  compact?: boolean;
}

interface CommandLog {
  id: string;
  timestamp: string;
  command: string;
  processed: boolean;
}

export const VoiceDiagnostic: React.FC<VoiceDiagnosticProps> = ({
  onVoiceCommand,
  onVoiceError,
  onVoiceStart,
  onVoiceEnd,
  compact = false,
}) => {
  const [commandLogs, setCommandLogs] = useState<CommandLog[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const logsRef = useRef<HTMLDivElement>(null);

  const {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
    resetListening,
  } = useSpeechRecognition({
    onEnhancedVoiceInput: (text: string) => {
      logVoice('VoiceDiagnostic: Enhanced voice input received:', text);
      onVoiceCommand?.(text);
    },
  });

  // Listen for voice command events
  useEffect(() => {
    const handleVoiceCommandProcessed = (event: CustomEvent) => {
      const { commandNumber, command, timestamp } = event.detail;
      
      const newLog: CommandLog = {
        id: `cmd-${commandNumber}-${Date.now()}`,
        timestamp,
        command,
        processed: true,
      };
      
      setCommandLogs(prev => {
        const updated = [newLog, ...prev.slice(0, compact ? 2 : 9)];
        return updated;
      });
      
      logVoice('VoiceDiagnostic: Command logged:', newLog);
    };

    window.addEventListener('voice-command-processed', handleVoiceCommandProcessed as EventListener);
    
    return () => {
      window.removeEventListener('voice-command-processed', handleVoiceCommandProcessed as EventListener);
    };
  }, [compact]);

  // Voice recognition event handlers
  useEffect(() => {
    if (isListening && onVoiceStart) {
      onVoiceStart();
    } else if (!isListening && onVoiceEnd) {
      onVoiceEnd();
    }
  }, [isListening, onVoiceStart, onVoiceEnd]);

  // Auto-scroll logs
  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = 0;
    }
  }, [commandLogs]);

  const handleStartStop = () => {
    if (isListening) {
      logVoice('VoiceDiagnostic: Stopping voice recognition');
      stopListening();
    } else {
      logVoice('VoiceDiagnostic: Starting voice recognition');
      startListening();
    }
  };

  const handleReset = () => {
    logVoice('VoiceDiagnostic: Resetting voice system');
    resetListening();
    setCommandLogs([]);
    setAudioLevel(0);
  };

  const clearLogs = () => {
    setCommandLogs([]);
    toast.info('Command logs cleared');
  };

  if (!isSupported) {
    return (
      <div className={`p-2 text-center ${compact ? 'text-xs' : 'text-sm'}`}>
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <MicOff className={compact ? "h-3 w-3" : "h-4 w-4"} />
          <span>Voice not supported</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${compact ? 'p-2' : 'p-3'}`}>
      {/* Voice Controls */}
      <div className="flex items-center gap-2">
        <Button
          onClick={handleStartStop}
          variant={isListening ? "destructive" : "default"}
          size={compact ? "sm" : "default"}
          className={`flex-1 transition-all duration-200 ${compact ? 'h-8 text-xs' : ''} ${
            isListening ? 'animate-pulse' : ''
          }`}
        >
          {isListening ? (
            <>
              <MicOff className={`${compact ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
              {compact ? 'Stop' : 'Stop Listening'}
            </>
          ) : (
            <>
              <Mic className={`${compact ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
              {compact ? 'Start' : 'Start Voice'}
            </>
          )}
        </Button>
        
        {!compact && (
          <Button
            onClick={handleReset}
            variant="outline"
            size="sm"
            title="Reset voice system"
            className="transition-all duration-200 hover:scale-105"
          >
            <Activity className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Audio Level Indicator */}
      {isListening && (
        <div className="flex items-center gap-2">
          <div className="flex space-x-1">
            {[...Array(compact ? 3 : 5)].map((_, i) => (
              <div
                key={i}
                className={`${compact ? 'w-1 h-2' : 'w-1 h-3'} bg-primary/60 rounded-full transition-all duration-150`}
                style={{
                  height: `${Math.max(compact ? 4 : 6, (audioLevel / 255) * (compact ? 8 : 12) + Math.random() * (compact ? 4 : 6))}px`,
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
          <Badge variant="secondary" className={compact ? "text-xs px-1" : "text-xs"}>
            {compact ? 'Active' : 'Listening...'}
          </Badge>
        </div>
      )}

      {/* Current Transcript */}
      {transcript && !compact && (
        <div className="p-2 bg-muted/50 rounded text-xs">
          <span className="text-muted-foreground">Current: </span>
          <span>"{transcript}"</span>
        </div>
      )}

      {/* Command Logs */}
      {commandLogs.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className={`font-medium text-muted-foreground ${compact ? 'text-xs' : 'text-sm'}`}>
              {compact ? 'Recent' : 'Recent Commands'}
            </span>
            {!compact && (
              <Button
                onClick={clearLogs}
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                title="Clear logs"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          <div 
            ref={logsRef}
            className={`space-y-1 ${compact ? 'max-h-16' : 'max-h-24'} overflow-y-auto`}
          >
            {commandLogs.map((log) => (
              <div 
                key={log.id}
                className={`flex items-center justify-between p-1 bg-muted/30 rounded transition-all duration-200 hover:bg-muted/50 ${
                  compact ? 'text-xs' : 'text-sm'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <span className="truncate block">{log.command}</span>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <span className="text-muted-foreground text-xs">{log.timestamp}</span>
                  {log.processed && <div className="w-1 h-1 bg-green-500 rounded-full" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Message */}
      {!isListening && commandLogs.length === 0 && (
        <div className={`text-center text-muted-foreground ${compact ? 'text-xs' : 'text-sm'}`}>
          {compact ? 'Ready for commands' : 'Click "Start Voice" to begin listening for commands'}
        </div>
      )}
    </div>
  );
};
