/**
 * @deprecated Legacy global voice listener.
 *
 * Not part of canonical Nova flow. Do not extend.
 * Prefer NovaFloat/useVoiceAgent/backend voiceAgent path for all new assistant behavior.
 */
import React, { useEffect, useCallback } from 'react';
import { useVoiceCommand } from '@/contexts/VoiceCommandContext';
import { VoiceCommand } from '@/utils/voiceCommandProcessor';
import { useNavigate } from 'react-router-dom';

// This component acts as the global fallback executor for voice commands
// It catches things like "Navigate to Insights" or "Open Brain Dump"
export const VoiceCommandGlobalListener: React.FC = () => {
  const { registerExecutor } = useVoiceCommand();
  const navigate = useNavigate();

  const handleGlobalCommand = useCallback((cmd: VoiceCommand) => {
    // Navigate commands could be multi_command or sequenced_command depending on parser
    // Check intents directly if they exist
    
    // Example: Opening the Brain Dump
    const isBrainDumpCommand = 
      (cmd.type === 'multi_command' && cmd.params?.originalText?.toLowerCase().includes('brain dump')) ||
      (cmd.type === 'sequenced_command' && cmd.params?.originalText?.toLowerCase().includes('brain dump'));
      
    if (isBrainDumpCommand) {
      console.log('🌍 Global listener caught navigation to Brain Dump');
      navigate('/brain-dump');
      return true; // Stop propagation
    }
    
    // We only return true if we fully handled the command.
    // Otherwise, we return false so page-specific listeners (like Dashboard) can handle it.
    return false;
  }, [navigate]);

  useEffect(() => {
    const unregister = registerExecutor(handleGlobalCommand);
    return () => unregister();
  }, [handleGlobalCommand, registerExecutor]);

  return null; // This is a logic-only component
};
