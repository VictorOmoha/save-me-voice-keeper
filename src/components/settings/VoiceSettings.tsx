import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Volume2, Mic, Key, Settings, Play, CheckCircle, AlertCircle } from "lucide-react";
import { 
  getElevenLabsApiKey, 
  setElevenLabsApiKey, 
  getMiniMaxApiKey,
  setMiniMaxApiKey,
  getSelectedTTSService,
  setSelectedTTSService,
  VOICE_OPTIONS, 
  MINIMAX_VOICES,
  getSelectedVoice, 
  setSelectedVoice,
  getSelectedMiniMaxVoice,
  setSelectedMiniMaxVoice,
  speak,
  stopCurrentSpeech,
  type TTSService
} from "@/utils/textToSpeech";
import { toast } from "sonner";

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

export const VoiceSettings: React.FC = () => {
  const [apiKey, setApiKey] = useState(getElevenLabsApiKey() || '');
  const [miniMaxApiKey, setMiniMaxApiKeyState] = useState(getMiniMaxApiKey() || '');
  const [selectedTTSService, setSelectedTTSServiceState] = useState<TTSService>(getSelectedTTSService());
  const [selectedVoice, setSelectedVoiceState] = useState<keyof typeof VOICE_OPTIONS>(getSelectedVoice());
  const [selectedMiniMaxVoice, setSelectedMiniMaxVoiceState] = useState<keyof typeof MINIMAX_VOICES>(getSelectedMiniMaxVoice());
  const [speechLanguage, setSpeechLanguage] = useState(
    localStorage.getItem('speech_language') || 'en-US'
  );
  const [speechRate, setSpeechRate] = useState(
    parseFloat(localStorage.getItem('speech_rate') || '0.9')
  );
  const [speechVolume, setSpeechVolume] = useState(
    parseFloat(localStorage.getItem('speech_volume') || '0.8')
  );
  const [autoSpeak, setAutoSpeak] = useState(
    localStorage.getItem('auto_speak') === 'true'
  );
  const [continuousListening, setContinuousListening] = useState(
    localStorage.getItem('continuous_listening') === 'true'
  );
  const [isTestingVoice, setIsTestingVoice] = useState(false);
  const [isValidatingKey, setIsValidatingKey] = useState(false);

  // Save settings to localStorage
  const saveSettings = () => {
    if (apiKey !== getElevenLabsApiKey()) {
      setElevenLabsApiKey(apiKey);
    }
    
    if (miniMaxApiKey !== getMiniMaxApiKey()) {
      setMiniMaxApiKey(miniMaxApiKey);
    }
    
    setSelectedTTSService(selectedTTSService);
    setSelectedVoice(selectedVoice);
    setSelectedMiniMaxVoice(selectedMiniMaxVoice);
    
    localStorage.setItem('speech_language', speechLanguage);
    localStorage.setItem('speech_rate', speechRate.toString());
    localStorage.setItem('speech_volume', speechVolume.toString());
    localStorage.setItem('auto_speak', autoSpeak.toString());
    localStorage.setItem('continuous_listening', continuousListening.toString());
    
    toast.success('Voice settings saved successfully!');
  };

  // Test voice with current settings
  const testVoice = async () => {
    setIsTestingVoice(true);
    stopCurrentSpeech();
    
    try {
      const testText = "Hello! This is a test of your voice settings. How does this sound?";
      console.log('Testing voice with:', selectedVoice);
      
      // Test the voice with the correct signature
      speak(testText, {
        rate: speechRate,
        pitch: 1,
        volume: speechVolume,
        onEnd: () => {
          toast.success('Voice test completed!');
          setIsTestingVoice(false);
        }
      });
      
    } catch (error) {
      console.error('Voice test failed:', error);
      toast.error('Voice test failed. Please check your ElevenLabs API key.');
      setIsTestingVoice(false);
    }
  };

  // Validate ElevenLabs API key
  const validateElevenLabsKey = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter an ElevenLabs API key');
      return;
    }

    setIsValidatingKey(true);
    
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': apiKey
        }
      });

      if (response.ok) {
        toast.success('ElevenLabs API key is valid!');
        setElevenLabsApiKey(apiKey);
      } else {
        toast.error('Invalid ElevenLabs API key. Please check and try again.');
      }
    } catch (error) {
      console.error('ElevenLabs API key validation failed:', error);
      toast.error('Failed to validate ElevenLabs API key. Please check your connection.');
    } finally {
      setIsValidatingKey(false);
    }
  };

  // Validate MiniMax API key
  const validateMiniMaxKey = async () => {
    if (!miniMaxApiKey.trim()) {
      toast.error('Please enter a MiniMax API key');
      return;
    }

    setIsValidatingKey(true);
    
    try {
      // Test with a simple TTS request
      const response = await fetch('https://api.minimax.chat/v1/text_to_speech', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${miniMaxApiKey}`,
        },
        body: JSON.stringify({
          text: 'Test',
          voice_id: 'male-qn-qingse',
          speed: 1.0,
          vol: 1.0,
          pitch: 0,
          audio_sample_rate: 32000,
          bitrate: 128000
        }),
      });

      if (response.ok) {
        toast.success('MiniMax API key is valid!');
        setMiniMaxApiKey(miniMaxApiKey);
      } else {
        toast.error('Invalid MiniMax API key. Please check and try again.');
      }
    } catch (error) {
      console.error('MiniMax API key validation failed:', error);
      toast.error('Failed to validate MiniMax API key. Please check your connection.');
    } finally {
      setIsValidatingKey(false);
    }
  };

  // Reset to defaults
  const resetToDefaults = () => {
    setSelectedVoiceState('aria');
    setSpeechLanguage('en-US');
    setSpeechRate(0.9);
    setSpeechVolume(0.8);
    setAutoSpeak(false);
    setContinuousListening(false);
    toast.info('Settings reset to defaults');
  };

  const handleVoiceChange = (voice: string) => {
    const voiceKey = voice as keyof typeof VOICE_OPTIONS;
    setSelectedVoiceState(voiceKey);
  };

  const handleMiniMaxVoiceChange = (voice: string) => {
    const voiceKey = voice as keyof typeof MINIMAX_VOICES;
    setSelectedMiniMaxVoiceState(voiceKey);
  };

  const hasElevenLabsKey = !!getElevenLabsApiKey();
  const hasMiniMaxKey = !!getMiniMaxApiKey();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Voice Settings</h2>
        <p className="text-muted-foreground">Configure your voice recognition and text-to-speech preferences</p>
      </div>

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
                <Select value={selectedTTSService} onValueChange={(value: TTSService) => setSelectedTTSServiceState(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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
                    <SelectItem value="browser">Browser TTS (Free)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Key className="h-5 w-5" />
                ElevenLabs API Configuration
                {hasElevenLabsKey && (
                  <Badge variant="secondary" className="ml-2">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apikey">API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="apikey"
                    type="password"
                    placeholder="Enter your ElevenLabs API key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <Button 
                    onClick={validateElevenLabsKey}
                    disabled={isValidatingKey || !apiKey.trim()}
                    variant="outline"
                  >
                    {isValidatingKey ? 'Validating...' : 'Validate'}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Get your API key from{' '}
                  <a 
                    href="https://elevenlabs.io" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    elevenlabs.io
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Key className="h-5 w-5" />
                MiniMax API Configuration
                {hasMiniMaxKey && (
                  <Badge variant="secondary" className="ml-2">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="minimaxkey">API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="minimaxkey"
                    type="password"
                    placeholder="Enter your MiniMax API key"
                    value={miniMaxApiKey}
                    onChange={(e) => setMiniMaxApiKeyState(e.target.value)}
                  />
                  <Button 
                    onClick={validateMiniMaxKey}
                    disabled={isValidatingKey || !miniMaxApiKey.trim()}
                    variant="outline"
                  >
                    {isValidatingKey ? 'Validating...' : 'Validate'}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Get your API key from{' '}
                  <a 
                    href="https://www.minimax.chat/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    minimax.chat
                  </a>
                </p>
              </div>
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
                </div>
              )}

              {selectedTTSService === 'browser' && (
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm text-muted-foreground">
                    Browser TTS will use your system's default voice. Quality and features may be limited compared to premium services.
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
                  <p>• Make sure your ElevenLabs API key is valid and has credits</p>
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

      <div className="flex justify-end pt-4 border-t">
        <Button onClick={saveSettings}>
          Save Settings
        </Button>
      </div>
    </div>
  );
};
