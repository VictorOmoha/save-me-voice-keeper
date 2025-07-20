import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, MicOff, Settings, Volume2, VolumeX } from "lucide-react";
import { processVoiceCommand, VoiceCommand } from "@/utils/voiceCommandProcessor";
import { getElevenLabsApiKey, setElevenLabsApiKey, VOICE_OPTIONS, getSelectedVoice, setSelectedVoice, stopCurrentSpeech } from "@/utils/textToSpeech";
import { toast } from "sonner";

interface VoiceControlModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onVoiceResult?: (text: string) => void;
  onVoiceCommand?: (command: VoiceCommand) => void;
}

export const VoiceControlModal: React.FC<VoiceControlModalProps> = ({ 
  isOpen, 
  onOpenChange, 
  onVoiceResult, 
  onVoiceCommand 
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const [lastCommand, setLastCommand] = useState<VoiceCommand | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedVoice, setSelectedVoiceState] = useState(getSelectedVoice());
  const [audioLevel, setAudioLevel] = useState(0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>();

  const handleApiKeySetup = () => {
    const apiKey = prompt('Enter your ElevenLabs API key for premium voice responses:');
    if (apiKey) {
      setElevenLabsApiKey(apiKey);
      toast.success('ElevenLabs API key saved! Premium voices enabled.');
    }
  };

  const handleVoiceChange = (voice: string) => {
    const voiceKey = voice as keyof typeof VOICE_OPTIONS;
    setSelectedVoice(voiceKey);
    setSelectedVoiceState(voiceKey);
    toast.success(`Voice changed to ${voice.charAt(0).toUpperCase() + voice.slice(1)}`);
  };

  const setupAudioVisualization = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);

      const updateAudioLevel = () => {
        if (analyserRef.current && isListening) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setAudioLevel(average);
          animationRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };
      updateAudioLevel();
    } catch (error) {
      console.error('Error setting up audio visualization:', error);
    }
  };

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setupAudioVisualization();
        console.log('Voice recognition started');
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        const currentTranscript = finalTranscript || interimTranscript;
        setTranscript(currentTranscript);

        if (finalTranscript) {
          console.log('Final transcript:', finalTranscript);
          
          // Process voice command
          const command = processVoiceCommand(finalTranscript);
          console.log('Processed command:', command);
          setLastCommand(command);
          
          if (command.type !== 'unknown' && onVoiceCommand) {
            onVoiceCommand(command);
          } else if (onVoiceResult) {
            onVoiceResult(finalTranscript);
          }
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied. Please allow microphone access.');
        } else if (event.error === 'no-speech') {
          toast.info('No speech detected. Try speaking again.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setAudioLevel(0);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
        console.log('Voice recognition ended');
      };
    } else {
      setIsSupported(false);
      console.log('Speech recognition not supported in this browser');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [onVoiceResult, onVoiceCommand]);

  const startListening = async () => {
    if (!isSupported) {
      toast.error('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      setTranscript("");
      setLastCommand(null);
      if (recognitionRef.current && !isListening) {
        recognitionRef.current.start();
      }
    } catch (error) {
      console.error('Microphone access error:', error);
      toast.error('Unable to access microphone. Please check your permissions.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    stopCurrentSpeech();
  };

  if (!isSupported) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MicOff className="h-5 w-5 text-muted-foreground" />
              Voice Commands Unavailable
            </DialogTitle>
            <DialogDescription>
              Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari for voice features.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Voice Assistant
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {showSettings && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Voice Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Voice Selection</label>
                <Select value={selectedVoice} onValueChange={handleVoiceChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(VOICE_OPTIONS).map((voice) => (
                      <SelectItem key={voice} value={voice}>
                        {voice.charAt(0).toUpperCase() + voice.slice(1)}
                        {!getElevenLabsApiKey() && ' (Browser)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {!getElevenLabsApiKey() && (
                <Button onClick={handleApiKeySetup} variant="outline" size="sm" className="w-full">
                  <Volume2 className="h-4 w-4 mr-2" />
                  Enable Premium Voices
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        <div className="space-y-4">
          {/* Audio Visualization */}
          <div className="flex justify-center">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
              isListening ? 'bg-red-100 border-4 border-red-200' : 'bg-blue-100 border-4 border-blue-200'
            }`}>
              {isListening ? (
                <div className="relative">
                  <Mic className="h-8 w-8 text-red-600" />
                  <div 
                    className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping"
                    style={{
                      transform: `scale(${1 + audioLevel / 100})`,
                      opacity: audioLevel / 255
                    }}
                  />
                </div>
              ) : (
                <Mic className="h-8 w-8 text-blue-600" />
              )}
            </div>
          </div>

          {/* Status and Controls */}
          <div className="text-center space-y-3">
            {isListening ? (
              <div>
                <div className="animate-pulse mb-2">
                  <p className="text-red-600 font-medium">Listening for commands...</p>
                  <div className="flex justify-center mt-2">
                    <div className="flex space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1 bg-red-400 rounded-full animate-pulse"
                          style={{
                            height: `${Math.max(4, (audioLevel / 255) * 20 + Math.random() * 10)}px`,
                            animationDelay: `${i * 0.1}s`
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <Button onClick={stopListening} variant="outline" size="sm">
                  <MicOff className="h-4 w-4 mr-2" />
                  Stop Listening
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-muted-foreground mb-3 text-sm">
                  Try commands like:<br/>
                  "Create a new entry" • "Show my documents" • "Search for medical"
                </p>
                <Button onClick={startListening} size="sm" className="w-full">
                  <Mic className="h-4 w-4 mr-2" />
                  Start Voice Commands
                </Button>
              </div>
            )}
          </div>

          {/* Transcript Display */}
          {transcript && (
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm font-medium text-muted-foreground mb-1">You said:</p>
                <p className="text-sm">"{transcript}"</p>
              </CardContent>
            </Card>
          )}

          {/* Command Display */}
          {lastCommand && lastCommand.type !== 'unknown' && (
            <Card>
              <CardContent className="pt-4">
                <p className="text-sm font-medium text-green-600 mb-1">Command detected:</p>
                <p className="text-sm capitalize">{lastCommand.type.replace('_', ' ')}</p>
                {lastCommand.params && Object.keys(lastCommand.params).length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {Object.entries(lastCommand.params).map(([key, value]) => 
                      value ? `${key}: ${value}` : null
                    ).filter(Boolean).join(', ')}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
