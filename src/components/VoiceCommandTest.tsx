
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, MicOff, Play, CheckCircle, XCircle, Clock, Volume2, AlertTriangle } from "lucide-react";
import { toast } from 'sonner';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { VoiceCommand, processVoiceCommand } from '@/utils/voiceCommandProcessor';

interface TestCommand {
  id: string;
  command: string;
  expectedResult: string;
  status: 'pending' | 'testing' | 'passed' | 'failed';
  actualResult?: string;
  timestamp?: number;
}

const TEST_COMMANDS: TestCommand[] = [
  {
    id: 'create-entry',
    command: 'create new entry',
    expectedResult: 'Opens add entry form and starts conversation',
    status: 'pending'
  },
  {
    id: 'open-all',
    command: 'show all entries',
    expectedResult: 'Shows all entries view',
    status: 'pending'
  },
  {
    id: 'add-field',
    command: 'add field name',
    expectedResult: 'Adds a field named "name" to current form',
    status: 'pending'
  },
  {
    id: 'set-title',
    command: 'title my document',
    expectedResult: 'Sets form title to "document"',
    status: 'pending'
  },
  {
    id: 'set-category',
    command: 'set category personal',
    expectedResult: 'Sets category to "Personal"',
    status: 'pending'
  },
  {
    id: 'cancel',
    command: 'cancel',
    expectedResult: 'Closes current form or cancels operation',
    status: 'pending'
  }
];

export const VoiceCommandTest: React.FC = () => {
  const [testCommands, setTestCommands] = useState<TestCommand[]>(TEST_COMMANDS);
  const [currentTestIndex, setCurrentTestIndex] = useState<number>(-1);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [testResults, setTestResults] = useState<{passed: number, failed: number, total: number}>({
    passed: 0, failed: 0, total: 0
  });
  const [testTimeout, setTestTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);

  const {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
    resetListening,
  } = useSpeechRecognition({
    onVoiceCommand: handleVoiceCommand,
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 TEST: Cleaning up voice test component');
      cleanupTest();
    };
  }, []);

  // Handle test mode flag
  useEffect(() => {
    if (isRunningTest) {
      (window as any).__test_mode = true;
      console.log('🧪 TEST: Enabled test mode');
    } else {
      (window as any).__test_mode = false;
      console.log('🧪 TEST: Disabled test mode');
    }
  }, [isRunningTest]);

  function handleVoiceCommand(command: VoiceCommand) {
    console.log('🧪 TEST: Voice command received:', command);
    
    // Prevent processing multiple commands simultaneously
    if (isProcessingCommand) {
      console.log('🧪 TEST: Already processing a command, ignoring');
      return;
    }
    
    if (isRunningTest && currentTestIndex >= 0) {
      setIsProcessingCommand(true);
      
      const currentTest = testCommands[currentTestIndex];
      const result = evaluateCommand(command, currentTest);
      
      updateTestResult(currentTestIndex, result.passed, result.message);
      
      // Clear timeout since we got a result
      clearCurrentTimeout();
      
      // Move to next test after a delay
      setTimeout(() => {
        setIsProcessingCommand(false);
        proceedToNextTest();
      }, 2000);
    }
  }

  const clearCurrentTimeout = () => {
    if (testTimeout) {
      clearTimeout(testTimeout);
      setTestTimeout(null);
      console.log('🧪 TEST: Cleared test timeout');
    }
  };

  const cleanupTest = () => {
    clearCurrentTimeout();
    setIsRunningTest(false);
    setCurrentTestIndex(-1);
    setIsProcessingCommand(false);
    stopListening();
  };

  const evaluateCommand = (command: VoiceCommand, test: TestCommand) => {
    console.log('🔍 TEST: Evaluating command:', { command, test });
    
    switch (test.id) {
      case 'create-entry':
        return {
          passed: command.type === 'create_entry',
          message: command.type === 'create_entry' 
            ? 'Successfully detected create entry command' 
            : `Expected create_entry, got ${command.type}`
        };
      
      case 'open-all':
        return {
          passed: command.type === 'open_entry' && command.params?.entryTitle === 'all_entries',
          message: command.type === 'open_entry' && command.params?.entryTitle === 'all_entries'
            ? 'Successfully detected show all entries command'
            : `Expected open_entry with all_entries, got ${command.type} with ${command.params?.entryTitle}`
        };
      
      case 'add-field':
        return {
          passed: command.type === 'create_field' && command.params?.fieldName?.toLowerCase().includes('name'),
          message: command.type === 'create_field' && command.params?.fieldName?.toLowerCase().includes('name')
            ? 'Successfully detected add field command'
            : `Expected create_field with name, got ${command.type} with ${command.params?.fieldName}`
        };
      
      case 'set-title':
        return {
          passed: command.type === 'set_title' && command.params?.titleValue?.toLowerCase().includes('document'),
          message: command.type === 'set_title' && command.params?.titleValue?.toLowerCase().includes('document')
            ? 'Successfully detected set title command'
            : `Expected set_title with document, got ${command.type} with ${command.params?.titleValue}`
        };
      
      case 'set-category':
        return {
          passed: command.type === 'set_category' && command.params?.categoryValue?.toLowerCase().includes('personal'),
          message: command.type === 'set_category' && command.params?.categoryValue?.toLowerCase().includes('personal')
            ? 'Successfully detected set category command'
            : `Expected set_category with personal, got ${command.type} with ${command.params?.categoryValue}`
        };
      
      case 'cancel':
        return {
          passed: command.type === 'cancel',
          message: command.type === 'cancel'
            ? 'Successfully detected cancel command'
            : `Expected cancel, got ${command.type}`
        };
      
      default:
        return {
          passed: false,
          message: 'Unknown test command'
        };
    }
  };

  const updateTestResult = (index: number, passed: boolean, message: string) => {
    setTestCommands(prev => prev.map((test, i) => 
      i === index 
        ? { 
            ...test, 
            status: passed ? 'passed' : 'failed', 
            actualResult: message,
            timestamp: Date.now()
          }
        : test
    ));

    setTestResults(prev => ({
      ...prev,
      passed: passed ? prev.passed + 1 : prev.passed,
      failed: passed ? prev.failed : prev.failed + 1,
      total: prev.total + 1
    }));

    toast[passed ? 'success' : 'error'](`Test ${passed ? 'PASSED' : 'FAILED'}: ${message}`);
  };

  const proceedToNextTest = async () => {
    const nextIndex = currentTestIndex + 1;
    
    if (nextIndex < testCommands.length) {
      console.log(`🎯 TEST: Moving to test ${nextIndex + 1}: "${testCommands[nextIndex].command}"`);
      
      // Stop current listening session first
      stopListening();
      
      // Wait a moment for cleanup
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCurrentTestIndex(nextIndex);
      setTestCommands(prev => prev.map((test, i) => 
        i === nextIndex ? { ...test, status: 'testing' } : test
      ));
      
      const nextTest = testCommands[nextIndex];
      
      toast.info(`🎯 Test ${nextIndex + 1}/${testCommands.length}: Say "${nextTest.command}"`);
      
      // Use text-to-speech to announce the test
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(`Test ${nextIndex + 1}. Please say: ${nextTest.command}`);
        utterance.rate = 0.8;
        speechSynthesis.speak(utterance);
        
        // Wait for TTS to finish before starting listening
        utterance.onend = () => {
          setTimeout(async () => {
            try {
              await startListening();
              console.log(`🎤 TEST: Started listening for test ${nextIndex + 1}`);
              
              // Set timeout for this specific test
              const timeout = setTimeout(() => {
                if (currentTestIndex === nextIndex && !isProcessingCommand) {
                  console.log(`⏰ TEST: Timeout for test ${nextIndex + 1}`);
                  updateTestResult(nextIndex, false, 'Test timed out - no voice command detected');
                  proceedToNextTest();
                }
              }, 20000); // 20 second timeout
              
              setTestTimeout(timeout);
              
            } catch (error) {
              console.error('🚨 TEST: Failed to start listening:', error);
              toast.error('Failed to start voice recognition for test');
            }
          }, 500);
        };
      } else {
        // Fallback if no TTS
        setTimeout(async () => {
          try {
            await startListening();
            console.log(`🎤 TEST: Started listening for test ${nextIndex + 1}`);
            
            const timeout = setTimeout(() => {
              if (currentTestIndex === nextIndex && !isProcessingCommand) {
                console.log(`⏰ TEST: Timeout for test ${nextIndex + 1}`);
                updateTestResult(nextIndex, false, 'Test timed out - no voice command detected');
                proceedToNextTest();
              }
            }, 20000);
            
            setTestTimeout(timeout);
            
          } catch (error) {
            console.error('🚨 TEST: Failed to start listening:', error);
            toast.error('Failed to start voice recognition for test');
          }
        }, 1500);
      }
    } else {
      finishTesting();
    }
  };

  const finishTesting = () => {
    console.log('🏁 TEST: Finishing test suite');
    cleanupTest();
    
    const { passed, failed, total } = testResults;
    const successRate = total > 0 ? Math.round((passed / total) * 100) : 0;
    
    toast.success(`🏁 Testing Complete! Success Rate: ${successRate}% (${passed}/${total})`);
    
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(
        `Voice command testing complete. Success rate: ${successRate} percent. ${passed} tests passed, ${failed} tests failed.`
      );
      speechSynthesis.speak(utterance);
    }
  };

  const startTesting = async () => {
    console.log('🚀 TEST: Starting voice command test suite');
    
    // Reset all tests
    setTestCommands(TEST_COMMANDS.map(test => ({ ...test, status: 'pending', actualResult: undefined })));
    setTestResults({ passed: 0, failed: 0, total: 0 });
    setCurrentTestIndex(-1);
    setIsRunningTest(true);
    setIsProcessingCommand(false);
    
    clearCurrentTimeout();
    
    // Reset and prepare voice recognition
    resetListening();
    
    // Start first test after a brief delay
    setTimeout(() => {
      proceedToNextTest();
    }, 1500);
  };

  const stopTesting = () => {
    console.log('🛑 TEST: Stopping voice command test suite');
    cleanupTest();
    toast.info('Voice command testing stopped');
  };

  const resetTests = () => {
    console.log('🔄 TEST: Resetting all tests');
    setTestCommands(TEST_COMMANDS.map(test => ({ ...test, status: 'pending', actualResult: undefined })));
    setTestResults({ passed: 0, failed: 0, total: 0 });
    setCurrentTestIndex(-1);
    setIsRunningTest(false);
    setIsProcessingCommand(false);
    
    clearCurrentTimeout();
    resetListening();
  };

  if (!isSupported) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Voice Recognition Not Supported
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">
            Your browser doesn't support voice recognition. Please use Chrome, Edge, or Safari.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="h-5 w-5" />
          Voice Command Accuracy Test Suite
        </CardTitle>
        <div className="flex items-center gap-4">
          <Badge variant={isListening ? "default" : "secondary"}>
            {isListening ? "Listening" : "Ready"}
          </Badge>
          {isRunningTest && (
            <Badge variant="outline">
              Test {currentTestIndex + 1} of {testCommands.length}
            </Badge>
          )}
          {testResults.total > 0 && (
            <Badge variant={testResults.passed === testResults.total ? "default" : "destructive"}>
              {testResults.passed}/{testResults.total} Passed
            </Badge>
          )}
          {isProcessingCommand && (
            <Badge variant="secondary">
              Processing...
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current Transcript */}
        {transcript && (
          <div className="p-3 bg-blue-50 rounded-lg border">
            <p className="text-sm font-medium text-blue-700">Current Input:</p>
            <p className="text-blue-600">"{transcript}"</p>
          </div>
        )}

        {/* Current Test Indicator */}
        {isRunningTest && currentTestIndex >= 0 && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="font-medium text-yellow-800">
                Current Test {currentTestIndex + 1}/{testCommands.length}
              </span>
            </div>
            <p className="text-yellow-700 font-medium">
              Please say: "{testCommands[currentTestIndex]?.command}"
            </p>
            <div className="flex items-center gap-2 mt-2">
              <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-sm text-yellow-600">
                {isListening ? '🎤 Listening for your command...' : '❌ Not listening - please wait for system to be ready'}
              </span>
            </div>
            {isProcessingCommand && (
              <div className="mt-2 text-sm text-blue-600">
                ⚙️ Processing your command...
              </div>
            )}
          </div>
        )}

        {/* Test Controls */}
        <div className="flex gap-2">
          {!isRunningTest ? (
            <Button onClick={startTesting} className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Start Test Suite
            </Button>
          ) : (
            <Button onClick={stopTesting} variant="destructive" className="flex items-center gap-2">
              <MicOff className="h-4 w-4" />
              Stop Testing
            </Button>
          )}
          <Button onClick={resetTests} variant="outline">
            Reset Tests
          </Button>
        </div>

        {/* Test Results */}
        <div className="space-y-2">
          <h3 className="font-semibold">Test Commands:</h3>
          {testCommands.map((test, index) => (
            <div
              key={test.id}
              className={`p-3 rounded-lg border ${
                test.status === 'testing' ? 'bg-yellow-50 border-yellow-200' :
                test.status === 'passed' ? 'bg-green-50 border-green-200' :
                test.status === 'failed' ? 'bg-red-50 border-red-200' :
                'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">"{test.command}"</span>
                    {test.status === 'testing' && <Clock className="h-4 w-4 text-yellow-600 animate-spin" />}
                    {test.status === 'passed' && <CheckCircle className="h-4 w-4 text-green-600" />}
                    {test.status === 'failed' && <XCircle className="h-4 w-4 text-red-600" />}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Expected: {test.expectedResult}
                  </p>
                  {test.actualResult && (
                    <p className={`text-sm mt-1 ${
                      test.status === 'passed' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      Result: {test.actualResult}
                    </p>
                  )}
                </div>
                <Badge variant={
                  test.status === 'testing' ? 'secondary' :
                  test.status === 'passed' ? 'default' :
                  test.status === 'failed' ? 'destructive' :
                  'outline'
                }>
                  {test.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="text-sm text-muted-foreground space-y-2 border-t pt-4">
          <p className="font-medium">Test Instructions:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Click "Start Test Suite" to begin automated testing</li>
            <li>Wait for the test announcement and listen for the command prompt</li>
            <li>Speak the requested command clearly when you hear "Please say:"</li>
            <li>Wait for the system to process your command (you'll see "Processing...")</li>
            <li>Each test has a 20-second timeout</li>
            <li>Results are automatically evaluated and the next test begins</li>
          </ol>
          
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-800 text-sm">
              <strong>Fixed Issues:</strong> Improved timeout handling to prevent loops, added command processing 
              state to prevent duplicate commands, and better cleanup between tests.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
