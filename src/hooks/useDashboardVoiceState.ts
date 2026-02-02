/**
 * useDashboardVoiceState Hook
 * Manages voice-related state for the dashboard
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { EnhancedVoiceCommand, voiceProcessor } from '@/utils/enhancedVoiceProcessor';
import { logDashboard } from '@/utils/logger';

export type ConversationStateType = 'listening' | 'confirming' | 'idle';

export interface VoiceState {
  isVoiceProcessing: boolean;
  lastVoiceCommand: EnhancedVoiceCommand | null;
  conversationState: ConversationStateType;
  hasPendingConfirmation: boolean;
  conversationData: {
    isActive: boolean;
    currentStep?: { question: string };
  };
}

export function useDashboardVoiceState() {
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const [lastVoiceCommand, setLastVoiceCommand] = useState<EnhancedVoiceCommand | null>(null);
  const [conversationState, setConversationState] = useState<ConversationStateType>('idle');
  const [hasPendingConfirmation, setHasPendingConfirmation] = useState(false);
  const [conversationData, setConversationData] = useState<VoiceState['conversationData']>({
    isActive: false,
  });

  const processingRef = useRef(false);

  // Clear any stuck state on mount
  useEffect(() => {
    logDashboard('Clearing any stuck voice processor state on mount');
    voiceProcessor.clearConfirmationState();
    setHasPendingConfirmation(false);
    setConversationState('idle');
  }, []);

  /**
   * Reset voice state
   */
  const resetVoiceState = useCallback(() => {
    setIsVoiceProcessing(false);
    setLastVoiceCommand(null);
    setConversationState('idle');
    setHasPendingConfirmation(false);
    setConversationData({ isActive: false });
    voiceProcessor.clearConfirmationState();
  }, []);

  /**
   * Start voice processing
   */
  const startVoiceProcessing = useCallback(() => {
    if (processingRef.current) {
      return false;
    }
    processingRef.current = true;
    setIsVoiceProcessing(true);
    setConversationState('listening');
    return true;
  }, []);

  /**
   * End voice processing
   */
  const endVoiceProcessing = useCallback(() => {
    setIsVoiceProcessing(false);
    processingRef.current = false;
  }, []);

  /**
   * Set confirmation state
   */
  const setConfirmationState = useCallback(
    (command: EnhancedVoiceCommand) => {
      setHasPendingConfirmation(true);
      setConversationState('confirming');
      setLastVoiceCommand(command);

      if (command.conversationalResponse) {
        voiceProcessor.setLastTTSPrompt(command.conversationalResponse);
      }
    },
    []
  );

  /**
   * Clear confirmation state
   */
  const clearConfirmationState = useCallback(() => {
    setHasPendingConfirmation(false);
    setConversationState('idle');
    setConversationData({ isActive: false });
    voiceProcessor.clearConfirmationState();
  }, []);

  /**
   * Set conversation data for follow-up
   */
  const setFollowUpState = useCallback(
    (expectsFollowUp: boolean) => {
      if (expectsFollowUp) {
        setConversationData({ isActive: true });
        setTimeout(() => {
          setConversationState('listening');
        }, 2000);
      } else {
        setConversationState('idle');
        setConversationData({ isActive: false });
      }
    },
    []
  );

  /**
   * Check if currently processing
   */
  const isProcessing = useCallback(() => processingRef.current, []);

  return {
    // State
    isVoiceProcessing,
    lastVoiceCommand,
    conversationState,
    hasPendingConfirmation,
    conversationData,

    // Setters
    setIsVoiceProcessing,
    setLastVoiceCommand,
    setConversationState,
    setHasPendingConfirmation,
    setConversationData,

    // Actions
    resetVoiceState,
    startVoiceProcessing,
    endVoiceProcessing,
    setConfirmationState,
    clearConfirmationState,
    setFollowUpState,
    isProcessing,
  };
}
