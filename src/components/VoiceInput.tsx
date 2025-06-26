
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface VoiceInputProps {
  onVoiceResult: (text: string) => void;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onVoiceResult }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  const startListening = () => {
    setIsListening(true);
    // Simulate voice recognition
    setTimeout(() => {
      const mockResult = "Add medication: Ibuprofen, 200mg, take every 4 hours";
      setTranscript(mockResult);
      onVoiceResult(mockResult);
      setIsListening(false);
    }, 3000);
  };

  const stopListening = () => {
    setIsListening(false);
    setTranscript("");
  };

  return (
    <Card className="cursor-pointer hover:shadow-lg transition-shadow">
      <CardHeader className="text-center">
        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
          <span className="text-2xl">🎤</span>
        </div>
        <CardTitle className="text-lg">Voice Input</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        {isListening ? (
          <div>
            <div className="animate-pulse mb-2">
              <div className="w-4 h-4 bg-red-500 rounded-full mx-auto mb-2"></div>
              <p className="text-red-600 font-medium">Listening...</p>
            </div>
            <Button onClick={stopListening} variant="outline" size="sm">
              Stop
            </Button>
          </div>
        ) : (
          <div>
            <p className="text-gray-600 mb-2">Speak to add information</p>
            <Button onClick={startListening} size="sm">
              Start Voice Input
            </Button>
          </div>
        )}
        {transcript && (
          <div className="mt-3 p-2 bg-gray-100 rounded text-sm">
            "{transcript}"
          </div>
        )}
      </CardContent>
    </Card>
  );
};
