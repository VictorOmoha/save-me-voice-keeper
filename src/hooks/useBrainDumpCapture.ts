import { useEffect, useRef, useState } from "react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

export const useBrainDumpCapture = () => {
  const { isListening, transcript, isSupported, startListening, stopListening, resetListening } = useSpeechRecognition({});
  const [started, setStarted] = useState(false);
  const interimRef = useRef("");

  useEffect(() => {
    if (!isSupported) return;
    // nothing special for now
  }, [isSupported]);

  const start = async () => {
    if (!isSupported) {
      alert('Speech recognition not supported in this browser. You can paste text instead.');
      return;
    }
    setStarted(true);
    startListening();
  };

  const stop = () => {
    stopListening();
    setStarted(false);
  };

  const reset = () => {
    resetListening();
    interimRef.current = "";
  };

  return {
    isListening: isListening || started,
    transcript,
    start,
    stop,
    reset,
  };
};
