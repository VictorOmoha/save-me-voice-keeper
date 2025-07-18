import React, { useEffect, useRef } from "react";
import { VoiceInputFixed } from "./VoiceInputFixed";

interface FloatingVoiceInputProps {
  onEnhancedVoiceInput: (text: string) => void;
  isVoiceProcessing?: boolean;
  lastVoiceCommand?: any;
  conversationState?: 'listening' | 'confirming' | 'idle';
  hasPendingConfirmation?: boolean;
  onCancelVoice?: () => void;
  conversationData?: { isActive: boolean; currentStep?: { question: string } };
}

export const FloatingVoiceInput: React.FC<FloatingVoiceInputProps> = (props) => {
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Auto-initialize voice input only once
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      console.log('🎤 FloatingVoiceInput: Auto-initializing voice recognition');
      
      // Dispatch event to start voice recognition automatically
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('auto-start-voice', {
          detail: { source: 'floating-voice-input' }
        }));
      }, 1000);
    }
  }, []);

  return (
    <VoiceInputFixed 
      {...props}
    />
  );
};