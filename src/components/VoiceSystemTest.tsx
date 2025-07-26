import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertTriangle, Mic, Volume2, Settings } from "lucide-react";
import { toast } from 'sonner';
import { SimpleVoiceInput } from './SimpleVoiceInput';
import { VoiceCommand } from '@/utils/voiceCommandProcessor';

interface TestResult {
  component: string;
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

export const VoiceSystemTest: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testVoiceCommand, setTestVoiceCommand] = useState<VoiceCommand | null>(null);

  const runSystemTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    const results: TestResult[] = [];

    // Test 1: Browser Support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    results.push({
      component: 'Browser',
      test: 'Speech Recognition Support',
      status: SpeechRecognition ? 'pass' : 'fail',
      message: SpeechRecognition ? 'Supported' : 'Not supported in this browser'
    });

    // Test 2: Microphone Access
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      results.push({
        component: 'Browser',
        test: 'Microphone Access',
        status: 'pass',
        message: 'Microphone access granted'
      });
    } catch (error) {
      results.push({
        component: 'Browser',
        test: 'Microphone Access',
        status: 'fail',
        message: 'Microphone access denied or unavailable'
      });
    }

    // Test 3: TTS Configuration
    const elevenLabsKey = localStorage.getItem('elevenlabs_api_key');
    const miniMaxKey = localStorage.getItem('minimax_api_key');
    const ttsService = localStorage.getItem('tts_service') || 'browser';
    
    if (ttsService === 'elevenlabs' && !elevenLabsKey) {
      results.push({
        component: 'TTS',
        test: 'ElevenLabs Configuration',
        status: 'fail',
        message: 'ElevenLabs selected but no API key configured'
      });
    } else if (ttsService === 'minimax' && !miniMaxKey) {
      results.push({
        component: 'TTS',
        test: 'MiniMax Configuration',
        status: 'fail',
        message: 'MiniMax selected but no API key configured'
      });
    } else {
      results.push({
        component: 'TTS',
        test: 'TTS Configuration',
        status: 'pass',
        message: `Using ${ttsService} TTS service`
      });
    }

    // Test 4: Global Variables
    const globalVars = [
      '__tts_is_speaking',
      '__manual_stop',
      '__speech_recognition_active'
    ];
    
    globalVars.forEach(varName => {
      const exists = varName in window;
      results.push({
        component: 'Global State',
        test: `Variable ${varName}`,
        status: exists ? 'pass' : 'warning',
        message: exists ? 'Initialized' : 'Not initialized (will be set when needed)'
      });
    });

    // Test 5: Voice Command Processing
    try {
      const { processVoiceCommand } = await import('@/utils/voiceCommandProcessor');
      const testCommand = processVoiceCommand('create new entry');
      results.push({
        component: 'Voice Processing',
        test: 'Command Processing',
        status: testCommand.type ? 'pass' : 'fail',
        message: testCommand.type ? `Processed as: ${testCommand.type}` : 'Failed to process command'
      });
    } catch (error) {
      results.push({
        component: 'Voice Processing',
        test: 'Command Processing',
        status: 'fail',
        message: `Error: ${error.message}`
      });
    }

    setTestResults(results);
    setIsRunning(false);
    
    const passed = results.filter(r => r.status === 'pass').length;
    const total = results.length;
    toast.success(`System tests completed: ${passed}/${total} passed`);
  };

  const handleVoiceCommand = (command: VoiceCommand) => {
    setTestVoiceCommand(command);
    toast.success(`Voice command received: ${command.type}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fail': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass': return 'bg-green-100 text-green-800';
      case 'fail': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Voice System Diagnostics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={runSystemTests}
            disabled={isRunning}
            className="w-full"
          >
            {isRunning ? 'Running Tests...' : 'Run System Tests'}
          </Button>

          {testResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Test Results</h3>
              {testResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result.status)}
                    <div>
                      <p className="font-medium">{result.component} - {result.test}</p>
                      <p className="text-sm text-muted-foreground">{result.message}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(result.status)}>
                    {result.status.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Live Voice Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SimpleVoiceInput onVoiceCommand={handleVoiceCommand} />
          
          {testVoiceCommand && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm font-medium text-green-800">Last Command Received:</p>
              <p className="text-sm text-green-700">
                Type: {testVoiceCommand.type}
                {testVoiceCommand.params && (
                  <span> | Params: {JSON.stringify(testVoiceCommand.params)}</span>
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};