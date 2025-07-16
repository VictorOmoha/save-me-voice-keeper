
import React from 'react';
import { VoiceCommandTest } from '@/components/VoiceCommandTest';

const VoiceTest = () => {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Voice Command Testing</h1>
          <p className="text-muted-foreground">
            Comprehensive test suite for voice recognition accuracy and command execution
          </p>
        </div>
        <VoiceCommandTest />
      </div>
    </div>
  );
};

export default VoiceTest;
