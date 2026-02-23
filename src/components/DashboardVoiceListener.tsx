import React, { useEffect, useCallback } from 'react';
import { useVoiceCommand } from '@/contexts/VoiceCommandContext';
import { VoiceCommand } from '@/utils/voiceCommandProcessor';
import { SavedEntry } from '@/types/dashboard';

interface DashboardVoiceListenerProps {
  savedEntries: SavedEntry[];
  onAddEntry: () => void;
  onEditEntry: (entry: SavedEntry) => void;
  onDeleteEntry: (id: string) => void;
  onSearchChange: (query: string) => void;
}

export const DashboardVoiceListener: React.FC<DashboardVoiceListenerProps> = ({
  savedEntries,
  onAddEntry,
  onEditEntry,
  onDeleteEntry,
  onSearchChange
}) => {
  const { registerExecutor } = useVoiceCommand();

  const handleCommand = useCallback((cmd: VoiceCommand) => {
    // We only care about single intents or sequenced intents that match dashboard actions
    let intentType = cmd.type;
    let params = cmd.params || {};

    // If it's a sequenced command from the new parser, extract the actual intent
    if (cmd.type === 'sequenced_command' && cmd.params?.intent) {
      intentType = cmd.params.intent.type as any;
      params = { ...params, ...cmd.params.intent.parameters };
    }

    console.log('🎙️ Dashboard Voice Listener processing:', intentType, params);

    switch (intentType) {
      case 'create_entry':
        console.log('🎙️ Dashboard Action: Create Entry');
        onAddEntry();
        // We could also pre-fill the form title/category here if params exist
        return true;

      case 'delete_entry':
        console.log('🎙️ Dashboard Action: Delete Entry');
        const searchTitle = params.entryTitle?.toLowerCase();
        if (searchTitle) {
          const match = savedEntries.find(e => e.title.toLowerCase().includes(searchTitle));
          if (match) {
            onDeleteEntry(match.id);
            return true;
          }
        }
        return false; // Let it fall through if we didn't find the entry

      case 'open_entry':
      case 'edit': // Legacy mapping
        console.log('🎙️ Dashboard Action: Open/Edit Entry');
        const openTitle = params.entryTitle?.toLowerCase() || params.originalText?.toLowerCase();
        if (openTitle) {
          const match = savedEntries.find(e => 
            e.title.toLowerCase().includes(openTitle) || 
            openTitle.includes(e.title.toLowerCase())
          );
          if (match) {
            onEditEntry(match);
            return true;
          }
        }
        return false;

      case 'search':
        console.log('🎙️ Dashboard Action: Search');
        const query = params.query || params.originalText?.replace(/search( for)? /i, '');
        if (query) {
          onSearchChange(query);
          return true;
        }
        return false;

      default:
        return false; // Not handled by Dashboard
    }
  }, [savedEntries, onAddEntry, onEditEntry, onDeleteEntry, onSearchChange]);

  useEffect(() => {
    const unregister = registerExecutor(handleCommand);
    return () => unregister();
  }, [handleCommand, registerExecutor]);

  return null;
};
