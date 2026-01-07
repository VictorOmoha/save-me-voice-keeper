import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { Mic, Play, TestTube } from "lucide-react";
import { useEffect, useState } from "react";
import { playEndOfSpeechCue, getAudioCueSettings, setAudioCueSettings } from "@/utils/audioCues";

export const EnhancedVoiceSettings = () => {
  const { toast } = useToast();
  const { preferences, updatePreferences, isLoading } = useUserPreferences();
  const [testText, setTestText] = useState("Hello, this is a voice test.");
  const [isTesting, setIsTesting] = useState(false);
  const [audioCueEnabled, setAudioCueEnabled] = useState(true);
  const [audioCueVolume, setAudioCueVolume] = useState(0.6);

  const handleVoiceTest = async () => {
    setIsTesting(true);
    try {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(testText);
        utterance.rate = preferences.voice_speech_rate;
        utterance.volume = preferences.voice_volume;
        utterance.lang = preferences.voice_language;
        speechSynthesis.speak(utterance);
      } else {
        toast({
          title: "Voice not supported",
          description: "Your browser doesn't support text-to-speech.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Test failed",
        description: "Failed to test voice settings.",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleUpdatePreference = async (key: string, value: any) => {
    const success = await updatePreferences({ [key]: value });
    if (success) {
      toast({
        title: "Settings updated",
        description: "Voice preference has been saved.",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="w-5 h-5" />
          Voice Settings
        </CardTitle>
        <p className="text-sm text-muted-foreground">Configure speech recognition and text-to-speech</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Speech Recognition */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Speech Recognition</h3>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Language</Label>
              <p className="text-xs text-muted-foreground">Select your speech recognition language</p>
            </div>
            <Select
              value={preferences.voice_language}
              onValueChange={(value) => handleUpdatePreference('voice_language', value)}
              disabled={isLoading}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en-US">English (US)</SelectItem>
                <SelectItem value="en-GB">English (UK)</SelectItem>
                <SelectItem value="es-ES">Spanish</SelectItem>
                <SelectItem value="fr-FR">French</SelectItem>
                <SelectItem value="de-DE">German</SelectItem>
                <SelectItem value="it-IT">Italian</SelectItem>
                <SelectItem value="pt-BR">Portuguese</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Continuous Listening</Label>
              <p className="text-xs text-muted-foreground">Keep microphone active for voice commands</p>
            </div>
            <Switch
              checked={preferences.voice_continuous_listening}
              onCheckedChange={(checked) => handleUpdatePreference('voice_continuous_listening', checked)}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Auto-speak Responses</Label>
              <p className="text-xs text-muted-foreground">Automatically speak AI responses</p>
            </div>
            <Switch
              checked={preferences.voice_auto_speak}
              onCheckedChange={(checked) => handleUpdatePreference('voice_auto_speak', checked)}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Text-to-Speech */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Text-to-Speech</h3>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">TTS Service</Label>
              <p className="text-xs text-muted-foreground">Choose your text-to-speech provider</p>
            </div>
            <Select
              value={preferences.tts_service}
              onValueChange={(value) => handleUpdatePreference('tts_service', value)}
              disabled={isLoading}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="google">Google Cloud TTS</SelectItem>
                <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                <SelectItem value="minimax">MiniMax</SelectItem>
                <SelectItem value="browser">Browser</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {preferences.tts_service === 'google' && (
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Google Cloud Voice</Label>
                <p className="text-xs text-muted-foreground">Select a high-quality neural voice</p>
              </div>
              <Select
                value={preferences.voice_id || 'en-US-Neural2-F'}
                onValueChange={(value) => handleUpdatePreference('voice_id', value)}
                disabled={isLoading}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en-US-Neural2-A">Male (Neural)</SelectItem>
                  <SelectItem value="en-US-Neural2-C">Female (Neural)</SelectItem>
                  <SelectItem value="en-US-Neural2-D">Male (Neural 2)</SelectItem>
                  <SelectItem value="en-US-Neural2-F">Female (Neural 2)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-sm font-medium">Speech Rate: {preferences.voice_speech_rate}x</Label>
            <Slider
              value={[preferences.voice_speech_rate]}
              onValueChange={([value]) => handleUpdatePreference('voice_speech_rate', value)}
              min={0.1}
              max={2.0}
              step={0.1}
              disabled={isLoading}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Volume: {Math.round(preferences.voice_volume * 100)}%</Label>
            <Slider
              value={[preferences.voice_volume]}
              onValueChange={([value]) => handleUpdatePreference('voice_volume', value)}
              min={0}
              max={1}
              step={0.1}
              disabled={isLoading}
              className="w-full"
            />
          </div>

          {/* Voice Test */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Test Voice</Label>
            <div className="flex gap-2">
              <Input
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Enter text to test voice..."
                className="flex-1"
              />
              <Button
                onClick={handleVoiceTest}
                disabled={isTesting || !testText.trim()}
                size="sm"
              >
                <Play className="w-4 h-4 mr-1" />
                {isTesting ? "Testing..." : "Test"}
              </Button>
            </div>
          </div>
        </div>

        {/* API Configuration */}
        {(preferences.tts_service === 'elevenlabs' || preferences.tts_service === 'minimax') && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">API Configuration</h3>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                API keys for {preferences.tts_service === 'google' ? 'Google Cloud' : preferences.tts_service} should be configured in the project settings for security.
              </p>
            </div>
          </div>
        )}

        {/* Voice Commands Help */}
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Voice Commands</h3>
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <p className="text-sm font-medium">Available Commands:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• "Add entry [content]" - Create a new entry</li>
              <li>• "Search for [query]" - Search entries</li>
              <li>• "Show dashboard" - Navigate to dashboard</li>
              <li>• "Open settings" - Open settings page</li>
              <li>• "Export data" - Export your data</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};