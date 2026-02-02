/**
 * TTS Error Boundary
 * Specialized error boundary for text-to-speech features
 */

import React, { Component, ReactNode } from 'react';
import { Volume2, VolumeX, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';

interface TTSErrorBoundaryProps {
  children: ReactNode;
  onRetry?: () => void;
  onFallbackToBrowser?: () => void;
  showFallbackOption?: boolean;
}

interface TTSErrorBoundaryState {
  hasError: boolean;
  errorType: 'api' | 'browser' | 'network' | 'unknown';
  errorMessage: string;
  useBrowserFallback: boolean;
}

export class TTSErrorBoundary extends Component<TTSErrorBoundaryProps, TTSErrorBoundaryState> {
  constructor(props: TTSErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorType: 'unknown',
      errorMessage: '',
      useBrowserFallback: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<TTSErrorBoundaryState> {
    const message = error.message.toLowerCase();
    let errorType: TTSErrorBoundaryState['errorType'] = 'unknown';

    if (message.includes('api') || message.includes('elevenlabs') || message.includes('minimax')) {
      errorType = 'api';
    } else if (message.includes('synthesis') || message.includes('speechsynthesis')) {
      errorType = 'browser';
    } else if (message.includes('network') || message.includes('fetch')) {
      errorType = 'network';
    }

    return {
      hasError: true,
      errorType,
      errorMessage: error.message,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('TTSErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      errorType: 'unknown',
      errorMessage: '',
    });
    this.props.onRetry?.();
  };

  handleUseBrowserFallback = () => {
    this.setState({
      hasError: false,
      useBrowserFallback: true,
    });

    toast.info('Switched to browser text-to-speech');
    this.props.onFallbackToBrowser?.();
  };

  renderErrorContent() {
    const { errorType } = this.state;
    const { showFallbackOption = true } = this.props;

    switch (errorType) {
      case 'api':
        return (
          <Alert>
            <VolumeX className="h-4 w-4" />
            <AlertTitle>Voice Service Unavailable</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-3">
                The premium voice service is temporarily unavailable. You can continue using
                browser-based voice or try again later.
              </p>
              <div className="flex gap-2 flex-wrap">
                {showFallbackOption && (
                  <Button size="sm" onClick={this.handleUseBrowserFallback}>
                    <Volume2 className="mr-2 h-4 w-4" />
                    Use Browser Voice
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={this.handleRetry}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        );

      case 'network':
        return (
          <Alert variant="destructive">
            <VolumeX className="h-4 w-4" />
            <AlertTitle>Network Error</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-3">
                Could not connect to the voice service. Please check your internet connection.
              </p>
              <div className="flex gap-2 flex-wrap">
                {showFallbackOption && (
                  <Button size="sm" onClick={this.handleUseBrowserFallback}>
                    <Volume2 className="mr-2 h-4 w-4" />
                    Use Offline Voice
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={this.handleRetry}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        );

      case 'browser':
        return (
          <Alert>
            <VolumeX className="h-4 w-4" />
            <AlertTitle>Browser Voice Unavailable</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-3">
                Your browser's text-to-speech feature is not available. Voice feedback will be
                disabled.
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
          <Alert>
            <VolumeX className="h-4 w-4" />
            <AlertTitle>Voice Feedback Error</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-3">
                An error occurred with voice feedback. You can continue without voice feedback or
                try again.
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={this.handleRetry}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </div>
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

export default TTSErrorBoundary;
