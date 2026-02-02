/**
 * Speech Recognition Error Boundary
 * Specialized error boundary for speech recognition features
 */

import React, { Component, ReactNode } from 'react';
import { MicOff, Mic, Settings, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';

interface SpeechRecognitionErrorBoundaryProps {
  children: ReactNode;
  onPermissionRequest?: () => void;
  onRetry?: () => void;
}

interface SpeechRecognitionErrorBoundaryState {
  hasError: boolean;
  errorCode: 'not-allowed' | 'audio-capture' | 'network' | 'aborted' | 'no-speech' | 'unknown';
  errorMessage: string;
}

export class SpeechRecognitionErrorBoundary extends Component<
  SpeechRecognitionErrorBoundaryProps,
  SpeechRecognitionErrorBoundaryState
> {
  constructor(props: SpeechRecognitionErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorCode: 'unknown',
      errorMessage: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<SpeechRecognitionErrorBoundaryState> {
    const message = error.message.toLowerCase();
    let errorCode: SpeechRecognitionErrorBoundaryState['errorCode'] = 'unknown';

    if (message.includes('not-allowed') || message.includes('permission')) {
      errorCode = 'not-allowed';
    } else if (message.includes('audio-capture') || message.includes('microphone')) {
      errorCode = 'audio-capture';
    } else if (message.includes('network')) {
      errorCode = 'network';
    } else if (message.includes('aborted')) {
      errorCode = 'aborted';
    } else if (message.includes('no-speech')) {
      errorCode = 'no-speech';
    }

    return {
      hasError: true,
      errorCode,
      errorMessage: error.message,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('SpeechRecognitionErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      errorCode: 'unknown',
      errorMessage: '',
    });
    this.props.onRetry?.();
  };

  handlePermissionRequest = () => {
    this.props.onPermissionRequest?.();
    // Attempt to request microphone permission
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(() => {
        toast.success('Microphone access granted! Try again.');
        this.handleRetry();
      })
      .catch(() => {
        toast.error('Microphone access denied. Please enable it in your browser settings.');
      });
  };

  renderErrorContent() {
    const { errorCode } = this.state;

    switch (errorCode) {
      case 'not-allowed':
        return (
          <Alert variant="destructive">
            <MicOff className="h-4 w-4" />
            <AlertTitle>Microphone Access Denied</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-3">
                Voice features require microphone access. Please allow microphone access in your
                browser settings.
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={this.handlePermissionRequest}>
                  <Mic className="mr-2 h-4 w-4" />
                  Request Access
                </Button>
                <Button size="sm" variant="outline" onClick={this.handleRetry}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        );

      case 'audio-capture':
        return (
          <Alert variant="destructive">
            <MicOff className="h-4 w-4" />
            <AlertTitle>No Microphone Found</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-3">
                No microphone was detected. Please connect a microphone and try again.
              </p>
              <Button size="sm" variant="outline" onClick={this.handleRetry}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry Detection
              </Button>
            </AlertDescription>
          </Alert>
        );

      case 'network':
        return (
          <Alert variant="destructive">
            <Settings className="h-4 w-4" />
            <AlertTitle>Network Error</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-3">
                Speech recognition requires an internet connection. Please check your connection and
                try again.
              </p>
              <Button size="sm" variant="outline" onClick={this.handleRetry}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        );

      case 'no-speech':
        return (
          <Alert>
            <Mic className="h-4 w-4" />
            <AlertTitle>No Speech Detected</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-3">
                No speech was detected. Please speak clearly into your microphone and try again.
              </p>
              <Button size="sm" variant="outline" onClick={this.handleRetry}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        );

      default:
        return (
          <Alert variant="destructive">
            <MicOff className="h-4 w-4" />
            <AlertTitle>Speech Recognition Error</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-3">
                An error occurred with speech recognition. Please try again.
              </p>
              <Button size="sm" variant="outline" onClick={this.handleRetry}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        );
    }
  }

  render() {
    if (this.state.hasError) {
      return <div className="p-4">{this.renderErrorContent()}</div>;
    }

    return this.props.children;
  }
}

export default SpeechRecognitionErrorBoundary;
