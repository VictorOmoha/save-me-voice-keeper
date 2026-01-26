import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
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
  tts_service: 'elevenlabs' | 'minimax' | 'google' | 'browser';
  elevenlabs_voice_id?: string;
  minimax_voice_id?: string;
  google_voice_id?: string;
  voice_audio_cue_enabled?: boolean;
  voice_audio_cue_volume?: number;
  has_completed_onboarding?: boolean;
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
  tts_service: 'google',
  voice_audio_cue_enabled: true,
  voice_audio_cue_volume: 0.4,
  has_completed_onboarding: false,
};

export const useUserPreferences = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('useUserPreferences: useEffect triggered, user:', !!user);

    if (user) {
      loadPreferences();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;

    try {
      const prefsRef = doc(db, 'user_preferences', user.uid);
      const prefsSnap = await getDoc(prefsRef);

      if (prefsSnap.exists()) {
        const data = prefsSnap.data();
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
          tts_service: (data.tts_service as 'elevenlabs' | 'minimax' | 'google' | 'browser') || 'google',
          elevenlabs_voice_id: data.elevenlabs_voice_id,
          minimax_voice_id: data.minimax_voice_id,
          google_voice_id: data.google_voice_id || 'en-US-Neural2-F',
          voice_audio_cue_enabled: data.voice_audio_cue_enabled ?? true,
          voice_audio_cue_volume: data.voice_audio_cue_volume ?? 0.4,
          has_completed_onboarding: data.has_completed_onboarding ?? false,
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
      const prefsRef = doc(db, 'user_preferences', user.uid);
      await setDoc(prefsRef, {
        user_id: user.uid,
        ...updates,
        updated_at: serverTimestamp()
      }, { merge: true });

      setPreferences(prev => {
        const next = { ...prev, ...updates };

        // Sync to localStorage for pure utility functions in textToSpeech.ts
        if (updates.tts_service) localStorage.setItem('selected_tts_service', updates.tts_service);
        if (updates.elevenlabs_voice_id) localStorage.setItem('selected_voice', updates.elevenlabs_voice_id);
        if (updates.minimax_voice_id) localStorage.setItem('selected_minimax_voice', updates.minimax_voice_id);
        if (updates.google_voice_id) localStorage.setItem('selected_google_voice', updates.google_voice_id);
        if (updates.voice_language) localStorage.setItem('speech_language', updates.voice_language);
        if (updates.voice_speech_rate !== undefined) localStorage.setItem('speech_rate', String(updates.voice_speech_rate));
        if (updates.voice_volume !== undefined) localStorage.setItem('speech_volume', String(updates.voice_volume));
        if (updates.voice_auto_speak !== undefined) localStorage.setItem('auto_speak', String(updates.voice_auto_speak));
        if (updates.voice_continuous_listening !== undefined) localStorage.setItem('continuous_listening', String(updates.voice_continuous_listening));
        if (updates.voice_audio_cue_enabled !== undefined) localStorage.setItem('voice_audio_cue_enabled', String(updates.voice_audio_cue_enabled));
        if (updates.voice_audio_cue_volume !== undefined) localStorage.setItem('voice_audio_cue_volume', String(updates.voice_audio_cue_volume));

        return next;
      });
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
