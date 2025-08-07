import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { errorTracker } from '@/utils/errorTracker';
import { performanceMonitor } from '@/utils/performanceMonitor';

export const VoiceDebugPanel: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [errorStats, setErrorStats] = useState<any>(null);
  const [performanceStats, setPerformanceStats] = useState<any>(null);

  useEffect(() => {
    if (!isVisible) return;

    const updateStats = () => {
      setErrorStats(errorTracker.getStats());
      setPerformanceStats({
        voice: performanceMonitor.getStats('voice'),
        form: performanceMonitor.getStats('form'),
        api: performanceMonitor.getStats('api')
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 2000);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50"
      >
        Debug
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-96 overflow-auto z-50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Voice Debug Panel</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsVisible(false)}
          >
            ✕
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="errors" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="errors">Errors</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="errors" className="space-y-2">
            {errorStats && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs">Last 24h:</span>
                  <Badge variant="outline">{errorStats.last24Hours}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>Voice: {errorStats.byType.voice}</div>
                  <div>Form: {errorStats.byType.form}</div>
                  <div>API: {errorStats.byType.api}</div>
                  <div>UI: {errorStats.byType.ui}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log('Error Logs:', errorTracker.getLogs());
                      navigator.clipboard.writeText(errorTracker.exportLogs());
                    }}
                  >
                    Export Logs
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => errorTracker.clear()}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="performance" className="space-y-2">
            {performanceStats && (
              <div className="space-y-2">
                <div className="text-xs space-y-1">
                  <div>Voice: {performanceStats.voice.avgDuration}ms avg</div>
                  <div>Form: {performanceStats.form.avgDuration}ms avg</div>
                  <div>API: {performanceStats.api.avgDuration}ms avg</div>
                </div>
                {performanceStats.voice.slowOperations.length > 0 && (
                  <div className="text-xs">
                    <div className="font-medium">Slow ops:</div>
                    {performanceStats.voice.slowOperations.slice(0, 3).map((op: any, i: number) => (
                      <div key={i} className="text-red-600">
                        {op.name}: {op.duration.toFixed(0)}ms
                      </div>
                    ))}
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => performanceMonitor.clear()}
                >
                  Clear Metrics
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};