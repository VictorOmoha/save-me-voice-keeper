
import React, { useEffect, useState } from 'react';
import { useVoiceOrchestrator } from '@/hooks/useVoiceOrchestrator';
import { brainDumpProcessor } from '@/utils/brainDumpProcessor';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, Brain, MessageCircle, Zap } from 'lucide-react';

interface ConversationalVoiceInterfaceProps {
  onEnhancedVoiceInput?: (text: string) => void;
  className?: string;
}

export const ConversationalVoiceInterface: React.FC<ConversationalVoiceInterfaceProps> = ({
  onEnhancedVoiceInput,
  className = '',
}) => {
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [processingBrainDump, setProcessingBrainDump] = useState(false);

  const { conversationState, activateConversation, deactivateConversation, isSupported } = useVoiceOrchestrator(
    (text: string) => {
      console.log('🎙️ Conversational Voice: Received input:', text);
      setCurrentTranscript(text);

      // Handle brain dump processing
      if (text.startsWith('BRAIN_DUMP:')) {
        handleBrainDump(text);
      } else if (onEnhancedVoiceInput) {
        onEnhancedVoiceInput(text);
      }
    },
    {
      autoStart: true,
      silenceTimeout: 10000, // 10 seconds for natural pauses
      maxSessionDuration: 900000, // 15 minutes
      brainDumpTimeout: 20000, // 20 seconds for brain dumps
    }
  );

  const handleBrainDump = async (brainDumpText: string) => {
    setProcessingBrainDump(true);
    
    try {
      const result = brainDumpProcessor.processBrainDump(brainDumpText);
      console.log('🧠 Brain dump processed:', result);

      // Create structured entry from brain dump
      const structuredInput = `CREATE_STRUCTURED_ENTRY: ${JSON.stringify({
        title: result.title,
        category: result.category,
        content: {
          actionItems: result.actionItems,
          keyPoints: result.keyPoints,
          notes: result.notes,
          originalText: brainDumpText.replace('BRAIN_DUMP:', '').trim(),
          ...result.structuredFields,
        },
        confidence: result.confidence,
      })}`;

      if (onEnhancedVoiceInput) {
        onEnhancedVoiceInput(structuredInput);
      }
    } catch (error) {
      console.error('Error processing brain dump:', error);
    } finally {
      setProcessingBrainDump(false);
    }
  };

  // Auto-clear transcript after processing
  useEffect(() => {
    if (currentTranscript) {
      const timer = setTimeout(() => {
        setCurrentTranscript('');
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
                    {conversationState.brainDumpMode 
                      ? '🧠 Brain dump mode - speak freely!' 
                      : conversationState.isListening 
                        ? 'Listening...' 
                        : 'Processing...'}
                  </span>
                )}
              </div>
            </div>

            {/* Mode Badges */}
            <div className="flex gap-2">
              {conversationState.brainDumpMode && (
                <Badge variant="secondary" className="text-xs">
                  <Brain className="h-3 w-3 mr-1" />
                  Brain Dump
                </Badge>
              )}
              
              {conversationState.isActive && !conversationState.brainDumpMode && (
                <Badge variant="default" className="text-xs">
                  <Zap className="h-3 w-3 mr-1" />
                  Conversation
                </Badge>
              )}
            </div>
          </div>

          {/* Current Transcript Display */}
          {currentTranscript && (
            <div className="mt-3 p-3 bg-muted/50 rounded-md">
              <div className="flex items-start gap-2">
                <Mic className="h-3 w-3 mt-0.5 text-primary flex-shrink-0" />
                <span className="text-sm text-foreground">
                  {processingBrainDump ? 'Processing brain dump...' : `"${currentTranscript}"`}
                </span>
              </div>
            </div>
          )}

          {/* Instructions for first-time users */}
          {!conversationState.isActive && (
            <div className="mt-3 p-3 bg-muted/30 rounded-md">
              <p className="text-xs text-muted-foreground text-center">
                💡 Voice mode auto-activates when you open the app. 
                <br />
                Say <strong>"Hey SaveMe"</strong> to reactivate, or <strong>"brain dump"</strong> for extended input.
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
                <span className="text-muted-foreground">"Open insurance policy"</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                <span className="text-muted-foreground">"Brain dump"</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                <span className="text-muted-foreground">"Close form"</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
