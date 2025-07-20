
import React from "react";
import { Mic, MicOff, MessageCircle } from "lucide-react";

interface VoiceStatusProps {
  isActive: boolean;
  isListening: boolean;
  isInConversation?: boolean;
}

export const VoiceStatus: React.FC<VoiceStatusProps> = ({
  isActive,
  isListening,
  isInConversation = false,
}) => {
  const getStatusColor = () => {
    if (isInConversation) return "text-blue-600";
    if (isListening) return "text-green-600";
    if (isActive) return "text-yellow-600";
    return "text-gray-400";
  };

  const getStatusText = () => {
    if (isInConversation) return "In Conversation";
    if (isListening) return "Listening...";
    if (isActive) return "Voice Mode Active";
    return "Voice Mode Inactive";
  };

  const getIcon = () => {
    if (isInConversation) return <MessageCircle className="h-4 w-4" />;
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
      {isInConversation && (
        <div className="ml-auto">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      )}
    </div>
  );
};
