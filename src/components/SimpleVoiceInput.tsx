import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import { VoiceSettingsModal } from "./VoiceSettingsModal";
import { processVoiceCommand, VoiceCommand } from "@/utils/voiceCommandProcessor";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { VoiceStatus } from "./voice/VoiceStatus";
import { VoiceControls } from "./voice/VoiceControls";
import { ConversationDisplay } from "./voice/ConversationDisplay";
import { TranscriptDisplay } from "./voice/TranscriptDisplay";
import { VoiceHelp } from "./voice/VoiceHelp";
import { VoiceUnsupported } from "./voice/VoiceUnsupported";

interface SimpleVoiceInputProps {
  onVoiceCommand?: (command: VoiceCommand) => void;
  onEnhancedVoiceInput?: (text: string) => void;
  conversationState?: { isActive: boolean; currentStep?: { question: string } };
}

export const SimpleVoiceInput: React.FC<SimpleVoiceInputProps> = ({
  onVoiceCommand,
  onEnhancedVoiceInput,
  conversationState,
}) => {
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  const {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
    resetListening,
  } = useSpeechRecognition({
    onVoiceCommand,
    onEnhancedVoiceInput,
    conversationState,
  });

  if (!isSupported) {
    return <VoiceUnsupported />;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <VoiceStatus
        isListening={isListening}
        conversationState={conversationState}
        onSettingsClick={() => setShowSettingsModal(true)}
      />

      {/* Voice Input Card */}
      <Card className={isListening ? "border-primary" : ""}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <span>Voice Input</span>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controls */}
          <VoiceControls
            isListening={isListening}
            onStart={() => {
              console.log('SimpleVoiceInput: onStart called, about to call startListening');
              console.log('SimpleVoiceInput: startListening function type:', typeof startListening);
              console.log('SimpleVoiceInput: startListening function:', startListening);
              try {
                startListening();
                console.log('SimpleVoiceInput: startListening() call completed');
              } catch (error) {
                console.error('SimpleVoiceInput: Error calling startListening:', error);
              }
            }}
            onStop={() => {
              console.log('SimpleVoiceInput: onStop called, about to call stopListening');
              stopListening();
            }}
            onReset={() => {
              console.log('SimpleVoiceInput: onReset called, about to call resetListening');
              resetListening();
            }}
          />

          {/* Conversation Status */}
          <ConversationDisplay conversationState={conversationState} />

          {/* Transcript Display */}
          <TranscriptDisplay transcript={transcript} />

          {/* Help Text */}
          <VoiceHelp isListening={isListening} transcript={transcript} />
        </CardContent>
      </Card>

      {/* Voice Settings Modal */}
      <VoiceSettingsModal 
        isOpen={showSettingsModal}
        onOpenChange={setShowSettingsModal}
      />
    </div>
  );
};