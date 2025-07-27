import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Mic } from "lucide-react";

interface VoiceLiveFeedbackProps {
  title?: string;
  category?: string;
  fields?: Array<{ name: string; type: string }>;
  currentStep?: string;
  isListening?: boolean;
}

export const VoiceLiveFeedback: React.FC<VoiceLiveFeedbackProps> = ({
  title,
  category,
  fields = [],
  currentStep,
  isListening
}) => {
  return (
    <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-blue-900 dark:text-blue-100">Live Entry Data</h4>
          {isListening && (
            <div className="flex items-center space-x-2">
              <Mic className="h-4 w-4 text-blue-500 animate-pulse" />
              <span className="text-xs text-blue-600">Listening...</span>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          {/* Title */}
          <div className="flex items-center justify-between p-2 bg-white/60 dark:bg-gray-800/60 rounded border">
            <span className="text-sm text-gray-600 dark:text-gray-300">Title:</span>
            <div className="flex items-center space-x-2">
              {title ? (
                <>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{title}</span>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </>
              ) : (
                <>
                  <span className="text-sm text-gray-400">Not set</span>
                  {currentStep === 'title' && <Clock className="h-4 w-4 text-blue-500 animate-pulse" />}
                </>
              )}
            </div>
          </div>

          {/* Category */}
          <div className="flex items-center justify-between p-2 bg-white/60 dark:bg-gray-800/60 rounded border">
            <span className="text-sm text-gray-600 dark:text-gray-300">Category:</span>
            <div className="flex items-center space-x-2">
              {category ? (
                <>
                  <Badge variant="secondary" className="text-xs">{category}</Badge>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </>
              ) : (
                <>
                  <span className="text-sm text-gray-400">Not set</span>
                  {currentStep === 'category' && <Clock className="h-4 w-4 text-blue-500 animate-pulse" />}
                </>
              )}
            </div>
          </div>

          {/* Custom Fields */}
          {fields.length > 0 && (
            <div className="p-2 bg-white/60 dark:bg-gray-800/60 rounded border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">Custom Fields:</span>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
              <div className="space-y-1">
                {fields.map((field, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span className="text-gray-700 dark:text-gray-200">{field.name}</span>
                    <Badge variant="outline" className="text-xs">{field.type}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};