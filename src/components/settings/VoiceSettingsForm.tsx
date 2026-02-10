import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Volume2, Mic, Key, Settings, Play, CheckCircle, AlertCircle, Activity, Eye, EyeOff, Loader2, Trash2, ExternalLink } from "lucide-react";
import {
    VOICE_OPTIONS,
    MINIMAX_VOICES,
    GOOGLE_VOICES,
    speak,
    stopCurrentSpeech,
    isCloudFunctionsConfigured
} from "@/utils/textToSpeech";
import { testApiKey, speakWithUserKey, ELEVENLABS_VOICES, hasUserApiKey } from "@/utils/userElevenLabsTTS";
import { playEndOfSpeechCue } from "@/utils/audioCues";
import { useUserPreferences, UserPreferences } from "@/hooks/useUserPreferences";
import { toast } from "sonner";
import { logError } from "@/utils/logger";

interface VoiceSettingsFormProps {
    showTitle?: boolean;
}

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

export const VoiceSettingsForm: React.FC<VoiceSettingsFormProps> = ({ showTitle = true }) => {
    const { preferences, updatePreferences, clearApiKey, isLoading } = useUserPreferences();
    const [isTestingVoice, setIsTestingVoice] = useState(false);
    const [testText, setTestText] = useState("Hello! This is a test of your voice settings. How does this sound?");
    
    // API Key state
    const [apiKeyInput, setApiKeyInput] = useState("");
    const [showApiKey, setShowApiKey] = useState(false);
    const [isValidatingKey, setIsValidatingKey] = useState(false);
    const [isTestingElevenLabs, setIsTestingElevenLabs] = useState(false);

    const handleUpdatePreference = async (updates: Partial<UserPreferences>) => {
        const success = await updatePreferences(updates);
        if (!success) {
            toast.error("Failed to update settings");
        }
    };

    const handleSaveApiKey = async () => {
        if (!apiKeyInput.trim()) {
            toast.error("Please enter an API key");
            return;
        }

        if (!apiKeyInput.startsWith('sk_')) {
            toast.error("Invalid API key format. ElevenLabs keys start with 'sk_'");
            return;
        }

        setIsValidatingKey(true);
        
        try {
            const result = await testApiKey(apiKeyInput);
            
            if (result.valid) {
                await handleUpdatePreference({ elevenlabs_api_key: apiKeyInput });
                setApiKeyInput("");
                toast.success("API key saved successfully!");
            } else {
                toast.error(result.error || "Invalid API key");
            }
        } catch (error) {
            toast.error("Failed to validate API key");
        } finally {
            setIsValidatingKey(false);
        }
    };

    const handleRemoveApiKey = async () => {
        const success = await clearApiKey();
        if (success) {
            toast.success("API key removed");
        } else {
            toast.error("Failed to remove API key");
        }
    };

    const handleTestElevenLabs = async () => {
        setIsTestingElevenLabs(true);
        
        try {
            await speakWithUserKey(testText, {
                voice: (preferences.elevenlabs_voice_id as keyof typeof ELEVENLABS_VOICES) || 'rachel',
                onEnd: () => {
                    setIsTestingElevenLabs(false);
                    toast.success("Voice test completed!");
                },
                onError: (error) => {
                    logError('Voice test error:', error);
                    toast.error("Voice test failed");
                    setIsTestingElevenLabs(false);
                }
            });
        } catch (error) {
            logError('Voice test error:', error);
            toast.error("Voice test failed");
            setIsTestingElevenLabs(false);
        }
    };

    const handleTestVoice = async () => {
        setIsTestingVoice(true);
        stopCurrentSpeech();

        try {
            await speak(testText, {
                rate: preferences.voice_speech_rate,
                pitch: 1,
                volume: preferences.voice_volume
            });
            toast.success('Voice test completed!');
        } catch (error) {
            logError('Voice test failed:', error);
            toast.error('Voice test failed. Please check your settings.');
        } finally {
            setIsTestingVoice(false);
        }
    };

    const cloudFunctionsAvailable = isCloudFunctionsConfigured();
    const userHasApiKey = !!preferences.elevenlabs_api_key;
    const maskedKey = preferences.elevenlabs_api_key 
        ? `sk_...${preferences.elevenlabs_api_key.slice(-8)}`
        : null;

    return (
        <div className="space-y-6">
            {showTitle && (
                <div>
                    <h2 className="text-2xl font-bold mb-2 text-primary">Voice Settings</h2>
                    <p className="text-muted-foreground">Configure your voice recognition and text-to-speech preferences</p>
                </div>
            )}

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="voices">Voices</TabsTrigger>
                    <TabsTrigger value="apikey">API Key</TabsTrigger>
                    <TabsTrigger value="advanced">Advanced</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4 pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Mic className="h-5 w-5 text-blue-500" />
                                Speech Recognition
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="language">Recognition Language</Label>
                                <Select
                                    value={preferences.voice_language}
                                    onValueChange={(value) => handleUpdatePreference({ voice_language: value })}
                                    disabled={isLoading}
                                >
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

                            <div className="flex items-center justify-between py-2">
                                <div className="space-y-1">
                                    <Label>Continuous Listening</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Keep listening for commands after processing one
                                    </p>
                                </div>
                                <Switch
                                    checked={preferences.voice_continuous_listening}
                                    onCheckedChange={(checked) => handleUpdatePreference({ voice_continuous_listening: checked })}
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="flex items-center justify-between py-2">
                                <div className="space-y-1">
                                    <Label>Auto-Speak Responses</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Automatically speak system responses
                                    </p>
                                </div>
                                <Switch
                                    checked={preferences.voice_auto_speak}
                                    onCheckedChange={(checked) => handleUpdatePreference({ voice_auto_speak: checked })}
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="flex items-center justify-between py-2">
                                <div className="space-y-1">
                                    <Label>End-of-speech Tone</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Play a short tone when TTS finishes
                                    </p>
                                </div>
                                <Switch
                                    checked={preferences.voice_audio_cue_enabled}
                                    onCheckedChange={(checked) => handleUpdatePreference({ voice_audio_cue_enabled: checked })}
                                    disabled={isLoading}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm">Tone Volume: {Math.round((preferences.voice_audio_cue_volume || 0.4) * 100)}%</Label>
                                <Slider
                                    value={[preferences.voice_audio_cue_volume || 0.4]}
                                    onValueChange={([value]) => handleUpdatePreference({ voice_audio_cue_volume: value })}
                                    min={0}
                                    max={1}
                                    step={0.05}
                                    disabled={isLoading}
                                    className="w-full"
                                />
                                <div className="flex justify-end">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => playEndOfSpeechCue()}
                                        className="h-8 text-xs gap-1"
                                    >
                                        <Volume2 className="h-3 w-3" />
                                        Test Tone
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="voices" className="space-y-4 pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Settings className="h-5 w-5 text-purple-500" />
                                TTS Service Selection
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Preferred TTS Service</Label>
                                <Select
                                    value={preferences.tts_service}
                                    onValueChange={(value) => handleUpdatePreference({ tts_service: value as any })}
                                    disabled={isLoading}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="elevenlabs">
                                            <div className="flex items-center justify-between w-full">
                                                <span>ElevenLabs</span>
                                                {userHasApiKey && (
                                                    <Badge variant="secondary" className="ml-2 text-xs bg-green-100 text-green-800 border-green-200">
                                                        Your Key
                                                    </Badge>
                                                )}
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="google" disabled={!cloudFunctionsAvailable}>
                                            <div className="flex items-center justify-between w-full">
                                                <span>Google Cloud TTS</span>
                                                {cloudFunctionsAvailable && <Badge variant="secondary" className="ml-2 text-xs bg-blue-100 text-blue-800 border-blue-200">Server</Badge>}
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="minimax" disabled={!cloudFunctionsAvailable}>
                                            <div className="flex items-center justify-between w-full">
                                                <span>MiniMax</span>
                                                {cloudFunctionsAvailable && <Badge variant="secondary" className="ml-2 text-xs">Server</Badge>}
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="browser">Browser Default</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {!userHasApiKey && preferences.tts_service === 'elevenlabs' && (
                                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg flex items-start gap-2 border border-amber-200 dark:border-amber-800">
                                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                                    <div className="text-xs text-amber-800 dark:text-amber-200">
                                        <p className="font-medium">API key required</p>
                                        <p className="mt-1">Add your ElevenLabs API key in the "API Key" tab to use this service.</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Volume2 className="h-5 w-5 text-green-500" />
                                Voice Selection
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {preferences.tts_service === 'elevenlabs' && (
                                <div className="space-y-2">
                                    <Label>ElevenLabs Voice</Label>
                                    <Select
                                        value={preferences.elevenlabs_voice_id || 'rachel'}
                                        onValueChange={(value) => handleUpdatePreference({ elevenlabs_voice_id: value })}
                                        disabled={isLoading}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.keys(VOICE_OPTIONS).map((voice) => (
                                                <SelectItem key={voice} value={voice.toLowerCase()}>
                                                    <span className="capitalize">{voice}</span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {preferences.tts_service === 'minimax' && (
                                <div className="space-y-2">
                                    <Label>MiniMax Voice</Label>
                                    <Select
                                        value={preferences.minimax_voice_id || 'male-qn-qingse'}
                                        onValueChange={(value) => handleUpdatePreference({ minimax_voice_id: value })}
                                        disabled={isLoading}
                                    >
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

                            {preferences.tts_service === 'google' && (
                                <div className="space-y-2">
                                    <Label>Google Cloud Voice</Label>
                                    <Select
                                        value={preferences.google_voice_id || 'en-US-Neural2-F'}
                                        onValueChange={(value) => handleUpdatePreference({ google_voice_id: value })}
                                        disabled={isLoading}
                                    >
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
                                </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm">Speech Rate: {preferences.voice_speech_rate.toFixed(1)}x</Label>
                                    <Slider
                                        value={[preferences.voice_speech_rate]}
                                        onValueChange={([value]) => handleUpdatePreference({ voice_speech_rate: value })}
                                        min={0.1}
                                        max={2.0}
                                        step={0.1}
                                        disabled={isLoading}
                                        className="w-full"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm">Volume: {Math.round(preferences.voice_volume * 100)}%</Label>
                                    <Slider
                                        value={[preferences.voice_volume]}
                                        onValueChange={([value]) => handleUpdatePreference({ voice_volume: value })}
                                        min={0}
                                        max={1}
                                        step={0.1}
                                        disabled={isLoading}
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2 pt-2">
                                <Label className="text-sm">Test Text</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={testText}
                                        onChange={(e) => setTestText(e.target.value)}
                                        placeholder="Enter text to test voice..."
                                        className="flex-1 h-9 text-sm"
                                    />
                                    {preferences.tts_service === 'elevenlabs' && userHasApiKey ? (
                                        <Button
                                            onClick={handleTestElevenLabs}
                                            disabled={isTestingElevenLabs || !testText.trim() || isLoading}
                                            size="sm"
                                            className="gap-1 px-4"
                                        >
                                            {isTestingElevenLabs ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <Play className="h-3.5 w-3.5" />
                                            )}
                                            Test
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={handleTestVoice}
                                            disabled={isTestingVoice || !testText.trim() || isLoading}
                                            size="sm"
                                            className="gap-1 px-4"
                                        >
                                            <Play className="h-3.5 w-3.5" />
                                            Test
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="apikey" className="space-y-4 pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Key className="h-5 w-5 text-amber-500" />
                                ElevenLabs API Key
                            </CardTitle>
                            <CardDescription>
                                Use your own ElevenLabs API key for high-quality AI voices
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {userHasApiKey ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                                        <div className="flex items-center gap-3">
                                            <CheckCircle className="h-5 w-5 text-green-600" />
                                            <div>
                                                <p className="font-medium text-green-800 dark:text-green-200">API Key Connected</p>
                                                <p className="text-xs text-green-600 dark:text-green-400 font-mono">{maskedKey}</p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleRemoveApiKey}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4 mr-1" />
                                            Remove
                                        </Button>
                                    </div>
                                    
                                    <div className="p-3 bg-muted/50 rounded-lg">
                                        <p className="text-xs text-muted-foreground">
                                            Your API key is stored securely and used directly from your browser to ElevenLabs. 
                                            We never store your key on our servers.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="apiKey">API Key</Label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Input
                                                    id="apiKey"
                                                    type={showApiKey ? "text" : "password"}
                                                    value={apiKeyInput}
                                                    onChange={(e) => setApiKeyInput(e.target.value)}
                                                    placeholder="sk_..."
                                                    className="pr-10 font-mono text-sm"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setShowApiKey(!showApiKey)}
                                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                                                >
                                                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                            <Button
                                                onClick={handleSaveApiKey}
                                                disabled={isValidatingKey || !apiKeyInput.trim()}
                                            >
                                                {isValidatingKey ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    "Save"
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <h4 className="font-medium text-blue-800 dark:text-blue-200 text-sm mb-2">How to get an API key:</h4>
                                        <ol className="text-xs text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                                            <li>Create a free account at <a href="https://elevenlabs.io" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900 inline-flex items-center gap-0.5">elevenlabs.io <ExternalLink className="h-3 w-3" /></a></li>
                                            <li>Go to your Profile Settings</li>
                                            <li>Find your API Key and copy it</li>
                                            <li>Paste it above and click Save</li>
                                        </ol>
                                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-3">
                                            Free tier includes 10,000 characters/month — enough for casual use!
                                        </p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-4 pt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Activity className="h-5 w-5 text-orange-500" />
                                Available Voice Commands
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {[
                                    { cmd: "Add entry [content]", desc: "Create a new entry" },
                                    { cmd: "Search for [term]", desc: "Search entries" },
                                    { cmd: "Show dashboard", desc: "View all saved data" },
                                    { cmd: "Open settings", desc: "Change preferences" },
                                    { cmd: "Export data", desc: "Download your data" },
                                    { cmd: "Clear log", desc: "Clear diagnostic logs" }
                                ].map((item, i) => (
                                    <div key={i} className="p-3 bg-muted/40 rounded border border-border/50">
                                        <p className="text-xs font-mono text-primary font-bold">"{item.cmd}"</p>
                                        <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">{item.desc}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 p-4 bg-blue-50/50 border border-blue-100 rounded-lg">
                                <h4 className="text-xs font-bold text-blue-800 uppercase tracking-widest mb-2">Pro Tip</h4>
                                <p className="text-xs text-blue-700 leading-relaxed">
                                    You can use continuous listening to speak multiple commands in a row. The system will wait for the "end-of-speech" tone before listening for the next one.
                                </p>
                            </div>

                            <Button
                                variant="outline"
                                className="w-full mt-4 text-xs h-9"
                                onClick={async () => {
                                    await handleUpdatePreference({
                                        tts_service: 'browser',
                                        voice_language: 'en-US',
                                        voice_speech_rate: 1.0,
                                        voice_volume: 1.0,
                                        voice_auto_speak: true,
                                        voice_continuous_listening: false,
                                        voice_audio_cue_enabled: true,
                                        voice_audio_cue_volume: 0.4,
                                    });
                                    toast.info("Settings reset to defaults");
                                }}
                            >
                                Reset to App Defaults
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};
