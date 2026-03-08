/**
 * @deprecated Legacy voice-command context.
 *
 * This provider is NOT part of the canonical Nova architecture.
 * Canonical path:
 *   NovaFloat -> NovaVoiceAgent -> useVoiceAgent -> backend voiceAgent -> app commands/events
 *
 * Do not add new voice features here.
 * Only keep temporarily for backward compatibility while legacy paths are removed.
 */
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { processVoiceCommandSync, VoiceCommand } from '@/utils/voiceCommandProcessor';
import { errorTracker } from '@/utils/errorTracker';

interface VoiceCommandContextType {
  lastCommand: VoiceCommand | null;
  registerExecutor: (executor: (cmd: VoiceCommand) => boolean) => () => void;
}

const VoiceCommandContext = createContext<VoiceCommandContextType | undefined>(undefined);

export const VoiceCommandProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lastCommand, setLastCommand] = useState<VoiceCommand | null>(null);
  const executorsRef = useRef<Array<(cmd: VoiceCommand) => boolean>>([]);

  const registerExecutor = useCallback((executor: (cmd: VoiceCommand) => boolean) => {
    executorsRef.current.push(executor);
    return () => {
      executorsRef.current = executorsRef.current.filter(e => e !== executor);
    };
  }, []);

  const executeCommand = useCallback((command: VoiceCommand) => {
    setLastCommand(command);
    console.log('🗣️ Voice command parsed and ready to execute:', command);
    
    // Check executors in LIFO order (last registered gets first priority)
    for (let i = executorsRef.current.length - 1; i >= 0; i--) {
      const handled = executorsRef.current[i](command);
      if (handled) {
        console.log('✅ Command handled by executor index:', i);
        return; // Event propagation stopped
      }
    }
    console.log('⚠️ Command was not handled by any registered executor.');
  }, []);

  useEffect(() => {
    const handleResult = (event: CustomEvent<{ transcript: string }>) => {
      const { transcript } = event.detail;
      const lowerTranscript = transcript.toLowerCase();
      
      // Filter out TTS feedback to prevent infinite loops
      if ((window as any).__tts_is_speaking) {
         console.log('🚫 Context Provider: TTS currently speaking, ignoring transcript:', transcript);
         return;
      }
      const ttsPatterns = [
        /what would you like to call/,
        /what category should/,
        /perfect entry preview/,
        /voice mode activated/,
        /how can i help you/,
        /try saying/,
        /bling bling/,
        /to confirm or no/
      ];
      if (ttsPatterns.some(pattern => pattern.test(lowerTranscript))) {
         console.log('🚫 Context Provider: Detected TTS feedback, ignoring:', transcript);
         return;
      }

      const command = processVoiceCommandSync(transcript);
      if (command.type !== 'unknown') {
        executeCommand(command);
      }
    };
    
    window.addEventListener('voice_transcript', handleResult as EventListener);
    return () => {
      window.removeEventListener('voice_transcript', handleResult as EventListener);
    };
  }, [executeCommand]);

  return (
    <VoiceCommandContext.Provider value={{ lastCommand, registerExecutor }}>
      {children}
    </VoiceCommandContext.Provider>
  );
};

export const useVoiceCommand = () => {
  const context = useContext(VoiceCommandContext);
  if (context === undefined) {
    throw new Error('useVoiceCommand must be used within a VoiceCommandProvider');
  }
  return context;
};
