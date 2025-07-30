import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Heart, 
  Users, 
  CreditCard, 
  User,
  Mic,
  Check,
  Plus
} from "lucide-react";

interface VoiceVisualHybridInterfaceProps {
  step: string;
  onSelection: (value: string) => void;
  isListening: boolean;
  question: string;
  availableOptions?: string[];
}

const CATEGORY_OPTIONS = [
  { value: 'Documents', label: 'Documents', icon: FileText, color: 'bg-blue-500' },
  { value: 'Health', label: 'Health', icon: Heart, color: 'bg-red-500' },
  { value: 'Contacts', label: 'Contacts', icon: Users, color: 'bg-green-500' },
  { value: 'Finance', label: 'Finance', icon: CreditCard, color: 'bg-yellow-500' },
  { value: 'Personal', label: 'Personal', icon: User, color: 'bg-purple-500' },
];

const FIELD_TYPE_OPTIONS = [
  { value: 'text', label: 'Text', description: 'Short text input' },
  { value: 'textarea', label: 'Long Text', description: 'Multi-line text' },
  { value: 'number', label: 'Number', description: 'Numeric values' },
  { value: 'date', label: 'Date', description: 'Date picker' },
];

export const VoiceVisualHybridInterface: React.FC<VoiceVisualHybridInterfaceProps> = ({
  step,
  onSelection,
  isListening,
  question,
  availableOptions
}) => {
  
  if (step === 'category') {
    return (
      <Card className="border-2 border-primary/30 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/30 dark:to-purple-950/30">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center space-x-2">
              <span>{question}</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant={isListening ? "default" : "secondary"} className="animate-pulse">
                <Mic className="h-3 w-3 mr-1" />
                {isListening ? 'Listening...' : 'Voice Ready'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground mb-4">
            <strong>Say the category name</strong> or <strong>click a button below</strong>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {CATEGORY_OPTIONS.map((option) => {
              const Icon = option.icon;
              return (
                <Button
                  key={option.value}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-center space-y-2 hover:scale-105 transition-all duration-200 group border-2 hover:border-primary"
                  onClick={() => onSelection(option.value)}
                >
                  <div className={`p-2 rounded-full ${option.color} text-white group-hover:scale-110 transition-transform`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium">{option.label}</span>
                </Button>
              );
            })}
          </div>
          
          <div className="text-xs text-center text-muted-foreground mt-4 p-2 bg-muted/30 rounded-lg">
            💡 <strong>Voice tip:</strong> Just say "{CATEGORY_OPTIONS[0].label}" or "{CATEGORY_OPTIONS[1].label}" etc.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'field_type') {
    return (
      <Card className="border-2 border-primary/30 bg-gradient-to-br from-green-50/50 to-blue-50/50 dark:from-green-950/30 dark:to-blue-950/30">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{question}</CardTitle>
            <Badge variant={isListening ? "default" : "secondary"} className="animate-pulse">
              <Mic className="h-3 w-3 mr-1" />
              {isListening ? 'Listening...' : 'Voice Ready'}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground mb-4">
            <strong>Say the field type</strong> or <strong>click a button below</strong>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FIELD_TYPE_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start space-y-1 hover:scale-105 transition-all duration-200 border-2 hover:border-primary"
                onClick={() => onSelection(option.value)}
              >
                <span className="font-medium">{option.label}</span>
                <span className="text-sm text-muted-foreground">{option.description}</span>
              </Button>
            ))}
          </div>
          
          <div className="text-xs text-center text-muted-foreground mt-4 p-2 bg-muted/30 rounded-lg">
            💡 <strong>Voice tip:</strong> Say "text", "number", "date", or "long text"
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'preview') {
    return (
      <Card className="border-2 border-green-500/30 bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/30 dark:to-emerald-950/30">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{question}</CardTitle>
            <Badge variant={isListening ? "default" : "secondary"} className="animate-pulse">
              <Mic className="h-3 w-3 mr-1" />
              {isListening ? 'Listening...' : 'Voice Ready'}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground mb-4">
            <strong>Say your choice</strong> or <strong>click a button below</strong>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button
              variant="default"
              size="lg"
              className="h-auto p-4 flex flex-col items-center space-y-2 bg-green-600 hover:bg-green-700"
              onClick={() => onSelection('save')}
            >
              <Check className="h-5 w-5" />
              <span className="font-medium">Save Entry</span>
              <span className="text-xs opacity-90">Create this entry</span>
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="h-auto p-4 flex flex-col items-center space-y-2 border-2 hover:border-primary"
              onClick={() => onSelection('add custom fields')}
            >
              <Plus className="h-5 w-5" />
              <span className="font-medium">Add Fields</span>
              <span className="text-xs text-muted-foreground">Add custom fields</span>
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="h-auto p-4 flex flex-col items-center space-y-2 border-2 hover:border-orange-500"
              onClick={() => onSelection('edit')}
            >
              <span className="font-medium">Edit</span>
              <span className="text-xs text-muted-foreground">Make changes</span>
            </Button>
          </div>
          
          <div className="text-xs text-center text-muted-foreground mt-4 p-2 bg-muted/30 rounded-lg">
            💡 <strong>Voice tip:</strong> Say "save", "add custom fields", or "edit"
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default minimal interface for other steps
  return (
    <Card className="border-2 border-primary/30">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{question}</p>
          <Badge variant={isListening ? "default" : "secondary"} className="animate-pulse">
            <Mic className="h-3 w-3 mr-1" />
            {isListening ? 'Listening...' : 'Voice Ready'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};