
import { processVoiceCommand, VoiceCommand } from "@/utils/voiceCommandProcessor";
import { toast } from "sonner";

interface SpeechRecognitionSetupProps {
  onVoiceCommand?: (command: VoiceCommand) => void;
  onEnhancedVoiceInput?: (text: string) => void;
  conversationState?: { isActive: boolean };
  setIsListening: (value: boolean) => void;
  setTranscript: (value: string) => void;
  lastProcessedTranscript: string;
  setLastProcessedTranscript: (value: string) => void;
  recognitionRef: React.MutableRefObject<SpeechRecognition | null>;
}

export const setupSpeechRecognition = ({
  onVoiceCommand,
  onEnhancedVoiceInput,
  conversationState,
  setIsListening,
  setTranscript,
  lastProcessedTranscript,
  setLastProcessedTranscript,
  recognitionRef,
}: SpeechRecognitionSetupProps) => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.error('🚨 Speech recognition not supported');
    return null;
  }

  // Clean up any existing recognition
  if ((window as any).__global_recognition) {
    try {
      (window as any).__global_recognition.abort();
    } catch (e) {
      console.log('🧹 Cleanup of existing recognition:', e);
    }
    (window as any).__global_recognition = null;
  }

  const recognition = new SpeechRecognition();
  (window as any).__global_recognition = recognition;
  
  // Configuration for individual command processing
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  recognition.maxAlternatives = 1;
  
  console.log('🔧 SETUP: Speech recognition configured for individual commands');
  
  let restartTimeout: NodeJS.Timeout | null = null;
  let isProcessingCommand = false;
  let commandCounter = 0;
  let lastCompleteTranscript = '';
  
  // Function to segment commands from transcript
  const segmentCommands = (transcript: string): string[] => {
    // Remove the transcript we've already processed
    let newText = transcript;
    if (lastCompleteTranscript && transcript.startsWith(lastCompleteTranscript)) {
      newText = transcript.substring(lastCompleteTranscript.length).trim();
    }
    
    if (!newText) return [];
    
    // Split on sentence endings and command boundaries
    const segments = newText.split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 2)
      .filter(s => !s.toLowerCase().includes('this is a test')); // Filter out test audio
    
    console.log('🔍 SEGMENTED:', { originalTranscript: transcript, newText, segments });
    return segments;
  };
  
  // Event handlers
  recognition.onstart = () => {
    console.log('🎤 SETUP: Speech recognition started - ready for individual commands');
    setIsListening(true);
    (window as any).__speech_recognition_active = true;
    
    if (restartTimeout) {
      clearTimeout(restartTimeout);
      restartTimeout = null;
    }
  };
  
  recognition.onresult = (event) => {
    console.log(`🎤 SETUP: Voice result received - ${event.results.length} results`);
    
    let finalTranscript = '';
    let interimTranscript = '';
    
    for (let i = 0; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0].transcript;
      
      if (result.isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }
    
    const currentTranscript = finalTranscript || interimTranscript;
    setTranscript(currentTranscript);
    
    // Process final results with command segmentation
    if (finalTranscript && finalTranscript.trim() !== lastProcessedTranscript.trim()) {
      console.log(`📝 SETUP: Processing final transcript:`, finalTranscript);
      
      if (isProcessingCommand) {
        console.log('⚠️ SETUP: Already processing command, queuing...');
        return;
      }
      
      // Segment the transcript into individual commands
      const commands = segmentCommands(finalTranscript);
      
      if (commands.length === 0) {
        console.log('📝 SETUP: No new commands found');
        return;
      }
      
      console.log(`📝 SETUP: Found ${commands.length} commands:`, commands);
      
      isProcessingCommand = true;
      setLastProcessedTranscript(finalTranscript);
      lastCompleteTranscript = finalTranscript;
      
      // Process each command sequentially
      commands.forEach((commandText, index) => {
        setTimeout(() => {
          const commandNum = ++commandCounter;
          console.log(`🔒 SETUP: Processing command ${commandNum}: "${commandText}"`);
          
          try {
            const command = processVoiceCommand(commandText);
            console.log(`📝 SETUP: Processed command ${commandNum}:`, command);
            
            // Call the appropriate handler
            if (onVoiceCommand) {
              console.log(`📝 SETUP: Calling onVoiceCommand [${commandNum}]`);
              onVoiceCommand(command);
            } else if (onEnhancedVoiceInput) {
              console.log(`📝 SETUP: Calling onEnhancedVoiceInput [${commandNum}] with:`, commandText);
              onEnhancedVoiceInput(commandText);
            }
            
            // Show feedback for each command
            if (command.type !== 'unknown') {
              console.log(`✅ SETUP: Command ${commandNum} executed: ${command.type}`);
              toast.success(`✅ Command ${commandNum}: ${command.type.replace('_', ' ')}`);
            } else {
              console.log(`ℹ️ SETUP: Processing command ${commandNum}: "${commandText}"`);
              toast.info(`📝 Command ${commandNum}: "${commandText}"`);
            }
          } catch (error) {
            console.error(`🚨 SETUP: Error processing command ${commandNum}:`, error);
            toast.error(`Failed to process command: "${commandText}"`);
          }
          
          // Reset processing flag after the last command
          if (index === commands.length - 1) {
            setTimeout(() => {
              console.log(`🔓 SETUP: Finished processing ${commands.length} commands`);
              isProcessingCommand = false;
              setTranscript("");
            }, 1000);
          }
        }, index * 500); // Stagger command processing
      });
    }
  };
  
  recognition.onerror = (event) => {
    console.error(`🚨 SETUP: Speech recognition error:`, event.error);
    
    switch (event.error) {
      case 'no-speech':
        console.log('🔇 SETUP: No speech detected - continuing...');
        break;
        
      case 'aborted':
        console.log('🛑 SETUP: Speech recognition aborted');
        setIsListening(false);
        isProcessingCommand = false;
        break;
        
      case 'not-allowed':
        console.error('🚫 SETUP: Microphone access denied');
        toast.error('Microphone access denied. Please allow microphone access.');
        setIsListening(false);
        (window as any).__speech_recognition_active = false;
        isProcessingCommand = false;
        break;
        
      case 'network':
        console.error('🌐 SETUP: Network error, attempting restart');
        toast.error('Network error. Retrying...');
        scheduleRestart();
        break;
        
      default:
        console.log(`🚨 SETUP: Speech recognition error:`, event.error);
        if (!['no-speech', 'aborted'].includes(event.error)) {
          scheduleRestart();
        }
    }
  };
  
  recognition.onend = () => {
    console.log(`🔚 SETUP: Speech recognition ended`);
    setIsListening(false);
    (window as any).__speech_recognition_active = false;
    
    // Auto-restart for continuous listening if not manually stopped
    if (recognitionRef.current && !(window as any).__manual_stop && !isProcessingCommand) {
      console.log(`🔄 SETUP: Auto-restarting for continuous listening`);
      scheduleRestart();
    } else {
      console.log(`🚫 SETUP: Not restarting - manual stop: ${!!(window as any).__manual_stop}, processing: ${isProcessingCommand}`);
    }
  };
  
  // Helper function to schedule restart
  const scheduleRestart = () => {
    if (restartTimeout) {
      clearTimeout(restartTimeout);
    }
    
    restartTimeout = setTimeout(() => {
      if (recognitionRef.current && !(window as any).__manual_stop && !isProcessingCommand) {
        try {
          console.log(`🔄 SETUP: Attempting restart`);
          recognitionRef.current.start();
        } catch (error) {
          console.log(`❌ SETUP: Restart failed:`, error.message);
          
          if (error.message.includes('already started')) {
            console.log('✅ SETUP: Recognition already running');
            setIsListening(true);
          } else {
            setTimeout(() => scheduleRestart(), 2000);
          }
        }
      }
    }, 1000);
  };
  
  return recognition;
};
