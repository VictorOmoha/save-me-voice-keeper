import { useEffect, useState, useRef } from 'react';
import { processVoiceCommand, VoiceCommand } from "@/utils/voiceCommandProcessor";
import { toast } from "sonner";

interface UseSpeechRecognitionProps {
  onVoiceCommand?: (command: VoiceCommand) => void;
  onEnhancedVoiceInput?: (text: string) => void;
  conversationState?: { isActive: boolean; currentStep?: { question: string } };
}

export const useSpeechRecognition = ({
  onVoiceCommand,
  onEnhancedVoiceInput,
  conversationState,
}: UseSpeechRecognitionProps) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const [lastProcessedTranscript, setLastProcessedTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      
      // Configure recognition
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = localStorage.getItem('speech_language') || 'en-US';
      
      // Event handlers
      recognition.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
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
        
        // Process final results
        if (finalTranscript && finalTranscript !== lastProcessedTranscript) {
          console.log('Processing final transcript:', finalTranscript);
          setLastProcessedTranscript(finalTranscript);
          
          // Process the command
          const command = processVoiceCommand(finalTranscript);
          
          // Call the appropriate handler
          if (onVoiceCommand) {
            onVoiceCommand(command);
          } else if (onEnhancedVoiceInput) {
            onEnhancedVoiceInput(finalTranscript);
          }
          
          // Show feedback
          if (command.type !== 'unknown') {
            toast.success(`Voice command: ${command.type.replace('_', ' ')}`);
          } else {
            toast.info(`Voice input: "${finalTranscript}"`);
          }
          
          // Clear transcript after processing
          setTimeout(() => {
            setTranscript("");
          }, 2000);
        }
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'aborted') {
          toast.error(`Speech recognition error: ${event.error}`);
        }
        setIsListening(false);
      };
      
      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
        
        // Auto-restart if we're in an active conversation and not manually stopped
        if (conversationState?.isActive && recognitionRef.current) {
          console.log('Auto-restarting voice recognition for conversation');
          setTimeout(() => {
            try {
              if (conversationState?.isActive && recognitionRef.current) {
                recognitionRef.current.start();
                setIsListening(true);
              }
            } catch (error) {
              console.error('Error restarting recognition:', error);
              // If restart fails, let user know they need to manually restart
              toast.info('Voice recognition stopped. Click "Start Voice Commands" to continue.');
            }
          }, 1000); // Longer delay to ensure clean restart
        }
      };
      
      recognitionRef.current = recognition;
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onVoiceCommand, onEnhancedVoiceInput, lastProcessedTranscript, conversationState?.isActive]);

  const startListening = () => {
    if (!isSupported) {
      toast.error('Speech recognition not supported in this browser');
      return;
    }
    
    if (recognitionRef.current && !isListening) {
      try {
        setTranscript("");
        setLastProcessedTranscript("");
        recognitionRef.current.start();
        toast.info('Voice recognition started - speak now');
      } catch (error) {
        console.error('Error starting speech recognition:', error);
        toast.error('Failed to start voice recognition');
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      toast.info('Voice recognition stopped');
    }
  };

  const resetListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    setTranscript("");
    setLastProcessedTranscript("");
    setIsListening(false);
  };

  return {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
    resetListening,
  };
};