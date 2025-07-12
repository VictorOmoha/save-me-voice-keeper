import React from "react";

interface TranscriptDisplayProps {
  transcript: string;
}

export const TranscriptDisplay: React.FC<TranscriptDisplayProps> = ({
  transcript,
}) => {
  if (!transcript) {
    return null;
  }

  return (
    <div className="p-3 bg-muted rounded-lg text-sm">
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium text-muted-foreground">You said:</span>
      </div>
      <p className="text-foreground">"{transcript}"</p>
    </div>
  );
};