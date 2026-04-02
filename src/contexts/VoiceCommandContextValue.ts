import { createContext } from 'react';
import type { VoiceCommand } from '@/utils/voiceCommandProcessor';

export interface VoiceCommandContextType {
  lastCommand: VoiceCommand | null;
  registerExecutor: (executor: (cmd: VoiceCommand) => boolean) => () => void;
}

export const VoiceCommandContext = createContext<VoiceCommandContextType | undefined>(undefined);
