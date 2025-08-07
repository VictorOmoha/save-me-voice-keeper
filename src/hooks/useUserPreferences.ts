import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  email_notifications: boolean;
  push_notifications: boolean;
  reminder_notifications: boolean;
  automation_notifications: boolean;
  voice_language: string;
  voice_continuous_listening: boolean;
  voice_auto_speak: boolean;
  voice_speech_rate: number;
  voice_volume: number;
  tts_service: 'elevenlabs' | 'minimax' | 'browser';
  elevenlabs_voice_id?: string;
  minimax_voice_id?: string;
}

const defaultPreferences: UserPreferences = {
  theme: 'system',
  language: 'en',
  email_notifications: true,
  push_notifications: true,
  reminder_notifications: true,
  automation_notifications: true,
  voice_language: 'en-US',
  voice_continuous_listening: false,
  voice_auto_speak: true,
  voice_speech_rate: 1.0,
  voice_volume: 1.0,
  tts_service: 'elevenlabs',
};

export const useUserPreferences = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadPreferences();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPreferences({
          theme: (data.theme as 'light' | 'dark' | 'system') || 'system',
          language: data.language || 'en',
          email_notifications: data.email_notifications ?? true,
          push_notifications: data.push_notifications ?? true,
          reminder_notifications: data.reminder_notifications ?? true,
          automation_notifications: data.automation_notifications ?? true,
          voice_language: data.voice_language || 'en-US',
          voice_continuous_listening: data.voice_continuous_listening ?? false,
          voice_auto_speak: data.voice_auto_speak ?? true,
          voice_speech_rate: data.voice_speech_rate || 1.0,
          voice_volume: data.voice_volume || 1.0,
          tts_service: (data.tts_service as 'elevenlabs' | 'minimax' | 'browser') || 'elevenlabs',
          elevenlabs_voice_id: data.elevenlabs_voice_id,
          minimax_voice_id: data.minimax_voice_id,
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      toast({
        title: "Error",
        description: "Failed to load user preferences.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          ...updates,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      setPreferences(prev => ({ ...prev, ...updates }));
      return true;
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast({
        title: "Error",
        description: "Failed to update preferences.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    preferences,
    updatePreferences,
    isLoading,
    loadPreferences,
  };
};