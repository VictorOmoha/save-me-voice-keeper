import React, { Component, ReactNode } from 'react';
import { errorTracker } from '@/utils/errorTracker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class VoiceErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    errorTracker.logError('ui', 'Voice component error boundary triggered', {
      errorInfo: errorInfo.componentStack,
      error: error.message
    }, error);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Voice System Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Something went wrong with the voice system. This is usually a temporary issue.
            </p>
            {this.state.error && (
              <div className="p-2 bg-muted rounded text-xs font-mono">
                {this.state.error.message}
              </div>
            )}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={this.handleReset}
              >
                Try Again
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.reload()}
              >
                Reload Page
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}