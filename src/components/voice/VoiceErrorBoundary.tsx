/**
 * Voice Error Boundary
 * Granular error handling for voice-related components
 */

import React, { Component, ReactNode } from 'react';
import { AlertCircle, Mic, MicOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface VoiceErrorBoundaryProps {
  children: ReactNode;
  fallbackMessage?: string;
  onRetry?: () => void;
  showRetryButton?: boolean;
  componentName?: string;
}

interface VoiceErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  errorType: 'recognition' | 'tts' | 'processing' | 'unknown';
}

export class VoiceErrorBoundary extends Component<VoiceErrorBoundaryProps, VoiceErrorBoundaryState> {
  constructor(props: VoiceErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: 'unknown',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<VoiceErrorBoundaryState> {
    // Categorize the error type
    const errorMessage = error.message.toLowerCase();
    let errorType: VoiceErrorBoundaryState['errorType'] = 'unknown';

    if (
      errorMessage.includes('speech') ||
      errorMessage.includes('recognition') ||
      errorMessage.includes('microphone')
    ) {
      errorType = 'recognition';
    } else if (errorMessage.includes('tts') || errorMessage.includes('speech synthesis')) {
      errorType = 'tts';
    } else if (errorMessage.includes('process') || errorMessage.includes('parse')) {
      errorType = 'processing';
    }

    return {
      hasError: true,
      error,
      errorType,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error
    console.error('VoiceErrorBoundary caught an error:', error, errorInfo);

    this.setState({ errorInfo });

    // Show toast notification
    const { componentName } = this.props;
    const location = componentName ? ` in ${componentName}` : '';
    toast.error(`Voice feature error${location}. Please try again.`);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: 'unknown',
    });

    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  getErrorIcon() {
    switch (this.state.errorType) {
      case 'recognition':
        return <MicOff className="h-12 w-12 text-red-500" />;
      case 'tts':
        return <Mic className="h-12 w-12 text-orange-500" />;
      default:
        return <AlertCircle className="h-12 w-12 text-yellow-500" />;
    }
  }

  getErrorTitle() {
    switch (this.state.errorType) {
      case 'recognition':
        return 'Speech Recognition Error';
      case 'tts':
        return 'Text-to-Speech Error';
      case 'processing':
        return 'Voice Processing Error';
      default:
        return 'Voice Feature Error';
    }
  }

  getErrorDescription() {
    const { fallbackMessage } = this.props;
    if (fallbackMessage) return fallbackMessage;

    switch (this.state.errorType) {
      case 'recognition':
        return 'There was a problem with speech recognition. Please check your microphone permissions and try again.';
      case 'tts':
        return 'There was a problem with text-to-speech. The voice feedback may not be available.';
      case 'processing':
        return 'There was a problem processing your voice input. Please try speaking again.';
      default:
        return 'An unexpected error occurred with the voice features. Please try again.';
    }
  }

  render() {
    if (this.state.hasError) {
      const { showRetryButton = true } = this.props;

      return (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">{this.getErrorIcon()}</div>
            <CardTitle className="text-red-700">{this.getErrorTitle()}</CardTitle>
            <CardDescription className="text-red-600">
              {this.getErrorDescription()}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            {showRetryButton && (
              <Button
                onClick={this.handleRetry}
                variant="outline"
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            )}

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left text-sm text-gray-600">
                <summary className="cursor-pointer">Technical Details</summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                  {this.state.error.message}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

/**
 * Higher-order component for wrapping voice components with error boundary
 */
export function withVoiceErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: Omit<VoiceErrorBoundaryProps, 'children'>
) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const ComponentWithErrorBoundary = (props: P) => (
    <VoiceErrorBoundary componentName={displayName} {...options}>
      <WrappedComponent {...props} />
    </VoiceErrorBoundary>
  );

  ComponentWithErrorBoundary.displayName = `withVoiceErrorBoundary(${displayName})`;

  return ComponentWithErrorBoundary;
}

export default VoiceErrorBoundary;
