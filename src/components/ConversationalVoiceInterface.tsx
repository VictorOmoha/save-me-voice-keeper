
import React, { useEffect, useState } from 'react';
import { useVoiceOrchestrator } from '@/hooks/useVoiceOrchestrator';
import { simpleVoiceProcessor, SimpleVoiceCommand } from '@/utils/simpleVoiceProcessor';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MessageCircle, Zap } from 'lucide-react';

interface ConversationalVoiceInterfaceProps {
  onVoiceCommand?: (command: SimpleVoiceCommand) => void;
  className?: string;
}

export const ConversationalVoiceInterface: React.FC<ConversationalVoiceInterfaceProps> = ({
  onVoiceCommand,
  className = '',
}) => {
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [lastCommand, setLastCommand] = useState<SimpleVoiceCommand | null>(null);

  const { conversationState, activateConversation, deactivateConversation, isSupported } = useVoiceOrchestrator(
    (text: string) => {
      console.log('🎙️ Conversational Voice: Received input:', text);
      setCurrentTranscript(text);

      // Process the voice command
      const command = simpleVoiceProcessor.processCommand(text);
      console.log('🎯 Processed command:', command);
      
      setLastCommand(command);
      
      if (onVoiceCommand && command.confidence > 0.3) {
        onVoiceCommand(command);
      }
    },
    {
      autoStart: true,
      silenceTimeout: 8000,
      maxSessionDuration: 600000,
    }
  );

  // Auto-clear transcript after processing
  useEffect(() => {
    if (currentTranscript) {
      const timer = setTimeout(() => {
        setCurrentTranscript('');
        setLastCommand(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentTranscript]);

  if (!isSupported) {
    return (
      <Card className={`border-muted ${className}`}>
        <CardContent className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Mic className="h-4 w-4" />
            <span className="text-sm">Voice recognition not supported in this browser</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main Voice Status Card */}
      <Card className={`border transition-all duration-300 ${
        conversationState.isActive 
          ? 'border-primary shadow-lg bg-primary/5' 
          : 'border-muted hover:border-primary/50'
      }`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Voice Status Indicator */}
              <div className="relative">
                <div className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  conversationState.isListening 
                    ? 'bg-green-500 animate-pulse' 
                    : conversationState.isActive 
                      ? 'bg-primary' 
                      : 'bg-muted-foreground'
                }`} />
                {conversationState.isListening && (
                  <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-500/30 animate-ping" />
                )}
              </div>

              {/* Status Text */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">
                    {conversationState.isActive ? 'Voice Active' : 'Voice Ready'}
                  </span>
                </div>
                
                {conversationState.isActive && (
                  <span className="text-xs text-muted-foreground">
                    {conversationState.isListening ? 'Listening...' : 'Processing...'}
                  </span>
                )}
              </div>
            </div>

            {/* Mode Badge */}
            {conversationState.isActive && (
              <Badge variant="default" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Active
              </Badge>
            )}
          </div>

          {/* Current Transcript and Command Display */}
          {currentTranscript && (
            <div className="mt-3 space-y-2">
              <div className="p-3 bg-muted/50 rounded-md">
                <div className="flex items-start gap-2">
                  <Mic className="h-3 w-3 mt-0.5 text-primary flex-shrink-0" />
                  <span className="text-sm text-foreground">"{currentTranscript}"</span>
                </div>
              </div>
              
              {lastCommand && lastCommand.type !== 'unknown' && (
                <div className="p-2 bg-green-50 border border-green-200 rounded-md">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-xs font-medium text-green-800">
                      Command: {lastCommand.type.replace('_', ' ')}
                      {lastCommand.target && ` (${lastCommand.target})`}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Instructions for first-time users */}
          {!conversationState.isActive && (
            <div className="mt-3 p-3 bg-muted/30 rounded-md">
              <p className="text-xs text-muted-foreground text-center">
                💡 Voice mode auto-activates when you open the app. 
                <br />
                Say <strong>"Hey SaveMe"</strong> to reactivate.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Voice Tips */}
      {conversationState.isActive && (
        <Card className="border-muted/50">
          <CardContent className="p-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-muted-foreground">"Create new entry"</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                <span className="text-muted-foreground">"Open insurance"</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                <span className="text-muted-foreground">"Show all entries"</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span className="text-muted-foreground">"Cancel"</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
