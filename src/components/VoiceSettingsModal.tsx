import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Volume2, Mic, Key, Settings, Play, CheckCircle, AlertCircle } from "lucide-react";
import {
  getSelectedMiniMaxVoice,
  setSelectedMiniMaxVoice,
  speak,
  stopCurrentSpeech,
  GOOGLE_VOICES,
  getSelectedGoogleVoice,
  setSelectedGoogleVoice,
  type TTSService
} from "@/utils/textToSpeech";
import { toast } from "sonner";

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// Language options for speech recognition
const LANGUAGE_OPTIONS = {
  'en-US': 'English (US)',
  'en-GB': 'English (UK)',
  'es-ES': 'Spanish',
  'fr-FR': 'French',
  'de-DE': 'German',
  'it-IT': 'Italian',
  'pt-PT': 'Portuguese',
  'ja-JP': 'Japanese',
  'ko-KR': 'Korean',
  'zh-CN': 'Chinese'
};

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({
  isOpen,
  onOpenChange
}) => {
  const [selectedTTSService, setSelectedTTSServiceState] = useState<TTSService>('elevenlabs');
  const [selectedVoice, setSelectedVoiceState] = useState<keyof typeof VOICE_OPTIONS>('adam');
  const [selectedMiniMaxVoice, setSelectedMiniMaxVoiceState] = useState<keyof typeof MINIMAX_VOICES>('male-qn-qingse');
  const [selectedGoogleVoice, setSelectedGoogleVoiceState] = useState<keyof typeof GOOGLE_VOICES>('en-US-Neural2-F');
  const [speechLanguage, setSpeechLanguage] = useState('en-US');
  const [speechRate, setSpeechRate] = useState(0.9);
  const [speechVolume, setSpeechVolume] = useState(0.8);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [continuousListening, setContinuousListening] = useState(false);
  const [isTestingVoice, setIsTestingVoice] = useState(false);

  // Initialize state from localStorage when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('🔄 Initializing VoiceSettingsModal state from localStorage');

      // API keys are now managed server-side
      setSelectedTTSServiceState(getSelectedTTSService());
      setSelectedVoiceState(getSelectedVoice());
      setSelectedMiniMaxVoiceState(getSelectedMiniMaxVoice());
      setSelectedGoogleVoiceState(getSelectedGoogleVoice());
      setSpeechLanguage(localStorage.getItem('speech_language') || 'en-US');
      setSpeechRate(parseFloat(localStorage.getItem('speech_rate') || '0.9'));
      setSpeechVolume(parseFloat(localStorage.getItem('speech_volume') || '0.8'));
      setAutoSpeak(localStorage.getItem('auto_speak') === 'true');
      setContinuousListening(localStorage.getItem('continuous_listening') === 'true');

      console.log('✅ VoiceSettingsModal state initialized');
    }
  }, [isOpen]);

  // Add voice command close event listener
  useEffect(() => {
    const handleVoiceClose = () => {
      if (isOpen) {
        console.log('🎙️ Voice command: closing settings modal');
        onOpenChange(false);
      }
    };

    window.addEventListener('close-modal', handleVoiceClose);
    window.addEventListener('close-settings', handleVoiceClose);

    return () => {
      window.removeEventListener('close-modal', handleVoiceClose);
      window.removeEventListener('close-settings', handleVoiceClose);
    };
  }, [isOpen, onOpenChange]);

  // Sync MiniMax voice selection with localStorage
  useEffect(() => {
    if (isOpen) {
      const storedMiniMaxVoice = getSelectedMiniMaxVoice();
      if (storedMiniMaxVoice !== selectedMiniMaxVoice) {
        console.log('🔄 Syncing MiniMax voice selection in modal:', storedMiniMaxVoice);
        setSelectedMiniMaxVoiceState(storedMiniMaxVoice);
      }
    }
  }, [isOpen, selectedMiniMaxVoice]);

  // Handle TTS service change with immediate persistence
  const handleTTSServiceChange = (service: TTSService) => {
    console.log('🔄 TTS service changed to:', service);
    setSelectedTTSServiceState(service);
    setSelectedTTSService(service); // Save immediately to localStorage
    toast.success(`TTS service changed to ${service}`);
  };

  // Save settings to localStorage
  const saveSettings = () => {
    console.log('💾 Saving voice settings from modal...');

    // API keys are now managed server-side - only save voice preferences
    setSelectedTTSService(selectedTTSService);
    setSelectedVoice(selectedVoice);
    setSelectedMiniMaxVoice(selectedMiniMaxVoice);
    setSelectedGoogleVoice(selectedGoogleVoice);

    localStorage.setItem('speech_language', speechLanguage);
    localStorage.setItem('speech_rate', speechRate.toString());
    localStorage.setItem('speech_volume', speechVolume.toString());
    localStorage.setItem('auto_speak', autoSpeak.toString());
    localStorage.setItem('continuous_listening', continuousListening.toString());

    console.log('✅ Voice settings saved successfully from modal');
    toast.success('Voice settings saved successfully!');
  };

  // Test voice with current settings
  const testVoice = async () => {
    setIsTestingVoice(true);
    stopCurrentSpeech();

    try {
      const testText = "Hello! This is a test of your voice settings. How does this sound?";
      console.log('🎙️ Testing voice with current TTS service:', selectedTTSService);

      if (selectedTTSService === 'elevenlabs') {
        console.log('🎙️ Testing ElevenLabs voice with:', selectedVoice);
      } else if (selectedTTSService === 'minimax') {
        console.log('🎙️ Testing MiniMax voice with:', selectedMiniMaxVoice);
      } else if (selectedTTSService === 'google') {
        console.log('🎙️ Testing Google Cloud voice with:', selectedGoogleVoice);
      } else {
        console.log('🎙️ Testing browser voice');
      }

      await speak(testText, {
        rate: speechRate,
        pitch: 1,
        volume: speechVolume
      });

      toast.success('Voice test completed!');

    } catch (error) {
      console.error('🚨 Voice test failed:', error);
      toast.error('Voice test failed. Using fallback browser voice.');
    } finally {
      setIsTestingVoice(false);
    }
  };

  // Reset to defaults
  const resetToDefaults = () => {
    console.log('🔄 Resetting voice settings to defaults from modal');
    setSelectedTTSServiceState('google');
    setSelectedVoiceState('adam');
    setSelectedMiniMaxVoiceState('male-qn-qingse');
    setSelectedGoogleVoiceState('en-US-Neural2-F');
    setSpeechLanguage('en-US');
    setSpeechRate(0.9);
    setSpeechVolume(0.8);
    setAutoSpeak(false);
    setContinuousListening(false);

    // Save defaults to localStorage immediately
    setSelectedTTSService('google');
    setSelectedVoice('adam');
    setSelectedMiniMaxVoice('male-qn-qingse');
    setSelectedGoogleVoice('en-US-Neural2-F');

    toast.info('Settings reset to defaults');
  };

  const handleVoiceChange = (voice: string) => {
    const voiceKey = voice as keyof typeof VOICE_OPTIONS;
    console.log('🎙️ ElevenLabs voice changed to:', voiceKey);
    setSelectedVoiceState(voiceKey);
    setSelectedVoice(voiceKey); // Save immediately
    toast.success(`Voice changed to ${voice}`);
  };

  const handleMiniMaxVoiceChange = (voice: string) => {
    const voiceKey = voice as keyof typeof MINIMAX_VOICES;
    console.log('🎙️ MiniMax voice changed to:', voiceKey, 'Name:', MINIMAX_VOICES[voiceKey]);
    setSelectedMiniMaxVoiceState(voiceKey);
    setSelectedMiniMaxVoice(voiceKey); // Save immediately to localStorage
    toast.success(`MiniMax voice changed to ${MINIMAX_VOICES[voiceKey]}`);
  };

  const handleGoogleVoiceChange = (voice: string) => {
    const voiceKey = voice as keyof typeof GOOGLE_VOICES;
    console.log('🎙️ Google voice changed to:', voiceKey, 'Name:', GOOGLE_VOICES[voiceKey]);
    setSelectedGoogleVoiceState(voiceKey);
    setSelectedGoogleVoice(voiceKey); // Save immediately
    toast.success(`Google voice changed to ${GOOGLE_VOICES[voiceKey]}`);
  };

  const hasElevenLabsKey = !!getElevenLabsApiKey();
  const hasMiniMaxKey = !!getMiniMaxApiKey();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Voice Control Settings
          </DialogTitle>
          <DialogDescription>
            Configure your voice recognition and text-to-speech preferences
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="voices">Voices</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mic className="h-5 w-5" />
                  Speech Recognition
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Recognition Language</Label>
                  <Select value={speechLanguage} onValueChange={setSpeechLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(LANGUAGE_OPTIONS).map(([code, name]) => (
                        <SelectItem key={code} value={code}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Continuous Listening</Label>
                    <p className="text-sm text-muted-foreground">
                      Keep listening for commands after processing one
                    </p>
                  </div>
                  <Switch
                    checked={continuousListening}
                    onCheckedChange={setContinuousListening}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Auto-Speak Responses</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically speak system responses
                    </p>
                  </div>
                  <Switch
                    checked={autoSpeak}
                    onCheckedChange={setAutoSpeak}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="voices" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  TTS Service Selection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Preferred TTS Service</Label>
                  <Select value={selectedTTSService} onValueChange={handleTTSServiceChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google">
                        <div className="flex items-center justify-between w-full">
                          <span>Google Cloud TTS</span>
                          <Badge variant="secondary" className="ml-2 text-xs">Primary</Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="elevenlabs">
                        <div className="flex items-center justify-between w-full">
                          <span>ElevenLabs</span>
                          {hasElevenLabsKey && <Badge variant="secondary" className="ml-2 text-xs">Connected</Badge>}
                        </div>
                      </SelectItem>
                      <SelectItem value="minimax">
                        <div className="flex items-center justify-between w-full">
                          <span>MiniMax</span>
                          {hasMiniMaxKey && <Badge variant="secondary" className="ml-2 text-xs">Connected</Badge>}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    Current selection: <span className="font-medium">{selectedTTSService}</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  API Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  API keys for Google Cloud, ElevenLabs and MiniMax are now managed server-side for security.
                  Contact your administrator to configure voice services.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Volume2 className="h-5 w-5" />
                  Voice Selection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedTTSService === 'elevenlabs' && (
                  <div className="space-y-2">
                    <Label>ElevenLabs Voice</Label>
                    <Select value={selectedVoice} onValueChange={handleVoiceChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(VOICE_OPTIONS).map((voice) => (
                          <SelectItem key={voice} value={voice}>
                            <span className="capitalize">{voice}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selectedTTSService === 'minimax' && (
                  <div className="space-y-2">
                    <Label>MiniMax Voice</Label>
                    <Select value={selectedMiniMaxVoice} onValueChange={handleMiniMaxVoiceChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(MINIMAX_VOICES).map(([key, name]) => (
                          <SelectItem key={key} value={key}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Current selection: {MINIMAX_VOICES[selectedMiniMaxVoice]}
                    </p>
                  </div>
                )}

                {selectedTTSService === 'google' && (
                  <div className="space-y-2">
                    <Label>Google Cloud Voice</Label>
                    <Select value={selectedGoogleVoice} onValueChange={handleGoogleVoiceChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(GOOGLE_VOICES).map(([key, name]) => (
                          <SelectItem key={key} value={key}>
                            {name} ({key})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Current selection: {GOOGLE_VOICES[selectedGoogleVoice]}
                    </p>
                  </div>
                )}


                <div className="space-y-2">
                  <Label>Speech Rate: {speechRate.toFixed(1)}x</Label>
                  <Slider
                    value={[speechRate]}
                    onValueChange={(value) => setSpeechRate(value[0])}
                    min={0.1}
                    max={2.0}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Volume: {Math.round(speechVolume * 100)}%</Label>
                  <Slider
                    value={[speechVolume]}
                    onValueChange={(value) => setSpeechVolume(value[0])}
                    min={0}
                    max={1}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                <Button
                  onClick={testVoice}
                  disabled={isTestingVoice}
                  variant="outline"
                  className="w-full"
                >
                  <Play className="h-4 w-4 mr-2" />
                  {isTestingVoice ? 'Testing Voice...' : 'Test Voice'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Advanced Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-md">
                  <h4 className="font-medium mb-2">Voice Commands</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• "Create new entry" - Start creating a new data entry</p>
                    <p>• "Show my documents" - View all saved entries</p>
                    <p>• "Search for [term]" - Search through your data</p>
                    <p>• "Export data" - Export your entries</p>
                    <p>• "Open settings" - Open application settings</p>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-md">
                  <h4 className="font-medium mb-2">Troubleshooting</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• If voice recognition doesn't work, check microphone permissions</p>
                    <p>• For better accuracy, speak clearly and avoid background noise</p>
                    <p>• ElevenLabs voices require an internet connection</p>
                    <p>• Make sure your API keys are valid and have credits</p>
                  </div>
                </div>

                <Button
                  onClick={resetToDefaults}
                  variant="outline"
                  className="w-full"
                >
                  Reset to Defaults
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={saveSettings}>
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
