import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Mic, MicOff, Brain, MessageCircle, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { EnhancedVoiceCommand } from "@/utils/enhancedVoiceProcessor";
import { cn } from "@/lib/utils";

interface EnhancedVoiceInputProps {
  onVoiceInput: (transcript: string) => void;
  isProcessing: boolean;
  lastCommand: EnhancedVoiceCommand | null;
  conversationState: 'listening' | 'confirming' | 'idle';
  hasPendingConfirmation: boolean;
  onCancel: () => void;
}

export const EnhancedVoiceInput: React.FC<EnhancedVoiceInputProps> = ({
  onVoiceInput,
  isProcessing,
  lastCommand,
  conversationState,
  hasPendingConfirmation,
  onCancel,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Global function to stop voice recognition from anywhere
    (window as any).__stopAllVoiceRecognition = () => {
      console.log('🛑 GLOBAL STOP: Stopping all voice recognition');
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      setIsProcessingAudio(false);
    };

    return () => {
      delete (window as any).__stopAllVoiceRecognition;
    };
  }, [isListening]);

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
      recognition.maxAlternatives = 3;

      recognition.onstart = () => {
        setIsListening(true);
        console.log('Enhanced voice recognition started');
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        let maxConfidence = 0;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          const confidence = result[0].confidence || 0;
          
          if (result.isFinal) {
            finalTranscript += transcript;
            maxConfidence = Math.max(maxConfidence, confidence);
          } else {
            interimTranscript += transcript;
          }
        }

        const currentTranscript = finalTranscript || interimTranscript;
        setTranscript(currentTranscript);
        setConfidence(maxConfidence);

        if (finalTranscript) {
          console.log('Final transcript:', finalTranscript, 'Confidence:', maxConfidence);
          
          // Prevent feedback loop - comprehensive TTS detection
          const lowerTranscript = finalTranscript.toLowerCase().trim();
          
          // Check if this is clearly a TTS output by looking for key patterns
          const ttsPatterns = [
            // Common TTS phrases
            /i'?ll help you/,
            /what information would you like/,
            /what would you like to add/,
            /perfect! i'?ll create/,
            /successfully created/,
            /i'?ll show you/,
            /sorry, i had trouble/,
            /could you please try/,
            /i didn'?t understand/,
            /try saying something/,
            /voice assistant/,
            /ai voice/,
            /what category should/,
            /great! i'?ve added/,
            /confirmed! i'?ll/,
            /okay, i'?ve cancelled/,
            /i didn'?t quite understand/,
            /could you please rephrase/,
            /hello! how can i help/,
            /searching for/,
            
            // Detect sentences that start with "I'll" (likely TTS)
            /^i'?ll\s/,
            
            // Detect questions that end with question words (likely TTS prompts)
            /what\s.*\?$/,
            /how\s.*\?$/,
            /would you like.*\?$/,
            /do you want.*\?$/,
          ];
          
          // Check for TTS patterns
          const isTTSOutput = ttsPatterns.some(pattern => pattern.test(lowerTranscript));
          
          // Also check if it's very short (likely partial TTS pickup)
          const isVeryShort = finalTranscript.trim().length < 5;
          
          // Check if confidence is very low (likely background noise or TTS)
          const isLowConfidence = maxConfidence < 0.3;
          
          // Check if transcript contains multiple sentences (likely TTS)
          const hasMultipleSentences = (finalTranscript.match(/[.!?]/g) || []).length > 1;
          
          // Check if transcript is suspiciously long (likely TTS)
          const isSuspiciouslyLong = finalTranscript.length > 50;
          
          if (isTTSOutput || isVeryShort || isLowConfidence || (hasMultipleSentences && isSuspiciouslyLong)) {
            console.log('🚫 BLOCKED TTS FEEDBACK:', {
              transcript: finalTranscript,
              confidence: maxConfidence,
              isTTSOutput,
              isVeryShort,
              isLowConfidence,
              hasMultipleSentences,
              isSuspiciouslyLong
            });
            return;
          }
          
          // Prevent processing if already processing or if TTS is speaking
          if (isProcessingAudio) {
            console.log('Already processing audio, ignoring new input');
            return;
          }

          // Check if TTS is currently speaking to prevent feedback
          if ((window as any).__tts_is_speaking) {
            console.log('TTS is speaking, ignoring voice input to prevent feedback');
            return;
          }
          
          setIsProcessingAudio(true);
          
          // Clear any existing timeout
          if (processingTimeoutRef.current) {
            clearTimeout(processingTimeoutRef.current);
          }
          
          // Stop listening immediately to prevent feedback loop
          if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
          }
          
          // Process the command
          onVoiceInput(finalTranscript);
          
          // Reset processing state after a delay
          processingTimeoutRef.current = setTimeout(() => {
            setIsProcessingAudio(false);
            
            // Check if we need to restart listening for follow-up
            import('@/utils/enhancedVoiceProcessor').then(({ voiceProcessor }) => {
              if (voiceProcessor.isExpectingFollowUp()) {
                console.log('Follow-up expected, restarting listening...');
                setTimeout(() => {
                  // Double-check TTS isn't still playing before restarting
                  if ((window as any).__tts_is_speaking) {
                    console.log('TTS still speaking, delaying restart...');
                    setTimeout(() => {
                      if (recognitionRef.current && !isListening && !(window as any).__tts_is_speaking) {
                        setTranscript("");
                        recognitionRef.current.start();
                      }
                    }, 2000);
                  } else if (recognitionRef.current && !isListening) {
                    setTranscript("");
                    recognitionRef.current.start();
                  }
                }, 5000); // Increased delay to 5 seconds
              }
            });
          }, 3000);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        
        if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please allow microphone access and try again.');
        } else if (event.error === 'no-speech') {
          console.log('No speech detected. Try speaking again.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setAudioLevel(0);
        console.log('Enhanced voice recognition ended');
      };
    } else {
      setIsSupported(false);
      console.log('Speech recognition not supported in this browser');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, [onVoiceInput, isListening]);

  // Simulate audio level for visual feedback and monitor TTS status
  useEffect(() => {
    if (isListening) {
      const interval = setInterval(() => {
        // Check if TTS started speaking while we're listening
        if ((window as any).__tts_is_speaking && recognitionRef.current && isListening) {
          console.log('TTS started, stopping voice recognition to prevent feedback');
          recognitionRef.current.stop();
        }
        setAudioLevel(Math.random() * 100);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isListening]);

  const startListening = async () => {
    if (!isSupported) {
      alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    // Prevent starting if already processing
    if (isProcessingAudio) {
      console.log('Cannot start listening while processing audio');
      return;
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      setTranscript("");
      setConfidence(0);
      setIsProcessingAudio(false);
      
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

  const getStateIcon = () => {
    if (isProcessing) return <Brain className="h-6 w-6 text-purple-600 animate-pulse" />;
    if (conversationState === 'confirming') return <AlertTriangle className="h-6 w-6 text-orange-600" />;
    if (isListening) return <Mic className="h-6 w-6 text-red-600" />;
    return <MessageCircle className="h-6 w-6 text-blue-600" />;
  };

  const getStateColor = () => {
    if (isProcessing) return 'bg-purple-100 dark:bg-purple-900/30';
    if (conversationState === 'confirming') return 'bg-orange-100 dark:bg-orange-900/30';
    if (isListening) return 'bg-red-100 dark:bg-red-900/30';
    return 'bg-blue-100 dark:bg-blue-900/30';
  };

  const getStateMessage = () => {
    if (isProcessing) return 'Processing with AI...';
    if (conversationState === 'confirming') return 'Waiting for confirmation...';
    if (isListening) return 'Listening for commands...';
    return 'AI Voice Assistant Ready';
  };

  if (!isSupported) {
    return (
      <Card className="opacity-50">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-2">
            <MicOff className="h-6 w-6 text-gray-400" />
          </div>
          <CardTitle className="text-lg text-gray-500">Enhanced Voice Commands</CardTitle>
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
    <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-primary/20">
      <CardHeader className="text-center pb-3">
        <div className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 transition-all duration-300",
          getStateColor()
        )}>
          {getStateIcon()}
        </div>
        <CardTitle className="text-lg flex items-center justify-center gap-2">
          Enhanced Voice Assistant
          <Badge variant="secondary" className="text-xs">
            AI-Powered
          </Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {getStateMessage()}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Audio Level Indicator */}
        {isListening && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Audio Level</span>
              <span>{Math.round(audioLevel)}%</span>
            </div>
            <Progress value={audioLevel} className="h-2" />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!isListening && conversationState === 'idle' && !isProcessingAudio && (
            <Button 
              onClick={startListening} 
              className="flex-1"
              disabled={isProcessing || isProcessingAudio}
            >
              <Mic className="h-4 w-4 mr-2" />
              Start Voice Command
            </Button>
          )}
          
          {isListening && (
            <Button onClick={stopListening} variant="outline" className="flex-1">
              <MicOff className="h-4 w-4 mr-2" />
              Stop Listening
            </Button>
          )}

          {/* Test TTS Button */}
          {conversationState === 'idle' && !isListening && (
            <Button 
              onClick={() => {
                console.log('Testing TTS...');
                import('@/utils/textToSpeech').then(({ speak }) => {
                  speak('Hello! This is a test of the text to speech system.');
                });
              }} 
              variant="secondary" 
              size="sm"
            >
              Test Audio
            </Button>
          )}

          {(conversationState === 'confirming' || hasPendingConfirmation) && (
            <>
              <Button 
                onClick={() => onVoiceInput('yes')} 
                variant="default" 
                size="sm"
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Confirm
              </Button>
              <Button 
                onClick={onCancel} 
                variant="outline" 
                size="sm"
                className="flex-1"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </>
          )}
        </div>

        {/* Transcript Display */}
        {transcript && (
          <div className="p-3 bg-muted rounded-lg text-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-muted-foreground">You said:</span>
              {confidence > 0 && (
                <Badge variant={confidence > 0.8 ? "default" : confidence > 0.5 ? "secondary" : "outline"}>
                  {Math.round(confidence * 100)}% confidence
                </Badge>
              )}
            </div>
            <p className="text-foreground">"{transcript}"</p>
          </div>
        )}

        {/* Command Feedback */}
        {lastCommand && lastCommand.intent !== 'unknown' && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-blue-700 dark:text-blue-300">AI Understanding:</span>
              <Badge variant={lastCommand.confidence > 0.8 ? "default" : "secondary"}>
                {lastCommand.intent}
              </Badge>
            </div>
            <p className="text-blue-900 dark:text-blue-100">
              {lastCommand.conversationalResponse}
            </p>
            {lastCommand.followUpQuestions && lastCommand.followUpQuestions.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">You could also try:</p>
                <ul className="text-xs text-blue-800 dark:text-blue-200">
                  {lastCommand.followUpQuestions.map((question, index) => (
                    <li key={index}>• {question}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Quick Examples */}
        {conversationState === 'idle' && !transcript && (
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-2">Try saying:</p>
            <div className="flex flex-wrap gap-1 justify-center">
              <Badge variant="outline" className="text-xs">
                "Create a medical record"
              </Badge>
              <Badge variant="outline" className="text-xs">
                "Find my documents"
              </Badge>
              <Badge variant="outline" className="text-xs">
                "Delete old entries"
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};