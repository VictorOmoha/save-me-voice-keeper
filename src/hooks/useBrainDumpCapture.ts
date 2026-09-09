import {useVoiceSession} from "@/contexts/VoiceSessionContext";

/** Brain Dump presents the same realtime session as Voice Capture and the dock. */
export const useBrainDumpCapture = () => {
  const voice = useVoiceSession();
  return {
    isSupported: typeof window !== "undefined" && !!window.RTCPeerConnection && !!navigator.mediaDevices?.getUserMedia,
    isListening: voice.microphoneActive,
    isProcessingVoice: ["connecting", "thinking", "acting"].includes(voice.status),
    transcript: voice.conversationHistory.filter((turn) => turn.role === "user")
      .map((turn) => turn.parts.map((part) => part.text || "").join(" ")).join("\n"),
    novaResponseText: voice.responseText,
    savedEntry: voice.savedMemories[0] || null,
    voiceError: voice.error,
    continuous: voice.continuous,
    setContinuous: voice.setContinuous,
    start: voice.startListening,
    stop: voice.stopListening,
    reset: voice.resetConversation,
  };
};
