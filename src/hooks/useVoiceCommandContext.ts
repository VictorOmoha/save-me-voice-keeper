import { useContext } from 'react';
import { VoiceCommandContext } from '@/contexts/VoiceCommandContextValue';

export const useVoiceCommand = () => {
  const context = useContext(VoiceCommandContext);
  if (context === undefined) {
    throw new Error('useVoiceCommand must be used within a VoiceCommandProvider');
  }
  return context;
}
