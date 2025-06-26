import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff } from "lucide-react";
import { processVoiceCommand, VoiceCommand } from "@/utils/voiceCommandProcessor";
import { getElevenLabsApiKey, setElevenLabsApiKey } from "@/utils/textToSpeech";

interface VoiceInputProps {
  onVoiceResult: (text: string) => void;
  onVoiceCommand?: (command: VoiceCommand) => void;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onVoiceResult, onVoiceCommand }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const [lastCommand, setLastCommand] = useState<VoiceCommand | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const handleApiKeySetup = () => {
    const apiKey = prompt('Enter your ElevenLabs API key for voice responses (optional):');
    if (apiKey) {
      setElevenLabsApiKey(apiKey);
      alert('ElevenLabs API key saved! Voice responses will now use high-quality AI voices.');
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
          } else {
            onVoiceResult(finalTranscript);
          }
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please allow microphone access and try again.');
        } else if (event.error === 'no-speech') {
          console.log('No speech detected. Please try speaking again.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
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
    };
  }, [onVoiceResult, onVoiceCommand]);

  const startListening = async () => {
    if (!isSupported) {
      alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      setTranscript("");
      setLastCommand(null);
      if (recognitionRef.current && !isListening) {
        recognitionRef.current.start();
      }
    } catch (error) {
      console.error('Microphone access error:', error);
      alert('Unable to access microphone. Please check your permissions.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  if (!isSupported) {
    return (
      <Card className="opacity-50">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <MicOff className="h-6 w-6 text-gray-400" />
          </div>
          <CardTitle className="text-lg text-gray-500">Voice Commands</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-500 text-sm">
            Speech recognition not supported in this browser
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow">
      <CardHeader className="text-center">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2 ${
          isListening ? 'bg-red-100' : 'bg-blue-100'
        }`}>
          {isListening ? (
            <Mic className="h-6 w-6 text-red-600" />
          ) : (
            <Mic className="h-6 w-6 text-blue-600" />
          )}
        </div>
        <CardTitle className="text-lg">Voice Commands</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        {isListening ? (
          <div>
            <div className="animate-pulse mb-2">
              <div className="w-4 h-4 bg-red-500 rounded-full mx-auto mb-2 animate-bounce"></div>
              <p className="text-red-600 font-medium">Listening for commands...</p>
            </div>
            <Button onClick={stopListening} variant="outline" size="sm">
              <MicOff className="h-4 w-4 mr-2" />
              Stop
            </Button>
          </div>
        ) : (
          <div>
            <p className="text-gray-600 mb-2 text-sm">
              Say commands like:<br/>
              "Create field called Name"<br/>
              "Delete entry People Info"<br/>
              "Open entry Medical Records"
            </p>
            <div className="space-y-2">
              <Button onClick={startListening} size="sm" className="w-full">
                <Mic className="h-4 w-4 mr-2" />
                Start Voice Commands
              </Button>
              {!getElevenLabsApiKey() && (
                <Button onClick={handleApiKeySetup} variant="outline" size="sm" className="w-full text-xs">
                  🎤 Setup Voice Responses
                </Button>
              )}
            </div>
          </div>
        )}
        
        {transcript && (
          <div className="mt-3 p-3 bg-gray-100 rounded-lg text-sm text-left">
            <p className="font-medium text-gray-700 mb-1">You said:</p>
            <p className="text-gray-900">"{transcript}"</p>
          </div>
        )}
        
        {lastCommand && lastCommand.type !== 'unknown' && (
          <div className="mt-2 p-2 bg-blue-50 rounded-lg text-sm">
            <p className="font-medium text-blue-700 mb-1">Command detected:</p>
            <p className="text-blue-900 capitalize">{lastCommand.type.replace('_', ' ')}</p>
            {lastCommand.params && Object.keys(lastCommand.params).length > 0 && (
              <p className="text-blue-800 text-xs mt-1">
                {Object.entries(lastCommand.params).map(([key, value]) => 
                  value ? `${key}: ${value}` : null
                ).filter(Boolean).join(', ')}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
