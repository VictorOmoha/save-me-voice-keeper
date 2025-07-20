
import React from "react";
import { Mic, MicOff, MessageCircle, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VoiceStatusProps {
  isListening?: boolean;
  isActive?: boolean;
  isInConversation?: boolean;
  conversationState?: { isActive: boolean; currentStep?: { question: string } };
  onSettingsClick?: () => void;
}

export const VoiceStatus: React.FC<VoiceStatusProps> = ({
  isListening = false,
  isActive = false,
  isInConversation = false,
  conversationState,
  onSettingsClick,
}) => {
  // Determine actual state from props
  const actualIsInConversation = isInConversation || conversationState?.isActive || false;
  const actualIsActive = isActive || conversationState?.isActive || false;

  const getStatusColor = () => {
    if (actualIsInConversation) return "text-blue-600";
    if (isListening) return "text-green-600";
    if (actualIsActive) return "text-yellow-600";
    return "text-gray-400";
  };

  const getStatusText = () => {
    if (actualIsInConversation) return "In Conversation";
    if (isListening) return "Listening...";
    if (actualIsActive) return "Voice Mode Active";
    return "Voice Mode Inactive";
  };

  const getIcon = () => {
    if (actualIsInConversation) return <MessageCircle className="h-4 w-4" />;
    if (isListening) return <Mic className="h-4 w-4" />;
    return <MicOff className="h-4 w-4" />;
  };

  return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-background border">
      <div className={`${getStatusColor()} ${isListening ? 'animate-pulse' : ''}`}>
        {getIcon()}
      </div>
      <span className={`text-sm font-medium ${getStatusColor()}`}>
        {getStatusText()}
      </span>
      {actualIsInConversation && (
        <div className="ml-auto">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      )}
      {onSettingsClick && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onSettingsClick}
          className="ml-auto"
        >
          <Settings className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
