import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SavedEntry } from "@/types/dashboard";
import { CategorySelector } from "./forms/CategorySelector";
import { VoiceStatusIndicator } from "./voice/VoiceStatusIndicator";
import { TypewriterText } from "./TypewriterText";
import { VoiceLiveFeedback } from "./VoiceLiveFeedback";
import { 
  Mic, 
  MicOff, 
  CheckCircle, 
  ArrowRight, 
  Plus, 
  Save,
  Sparkles,
  Volume2,
  Eye
} from "lucide-react";

interface VoiceStep {
  id: string;
  title: string;
  question: string;
  completed: boolean;
  current: boolean;
  data?: any;
}

interface VoiceGuidedEntryWizardProps {
  onSave: (entry: Omit<SavedEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  conversationState: {
    isInConversation: boolean;
    currentStep?: { type: string; question: string };
    entryDraft?: any;
  };
  isVoiceActive: boolean;
}

export const VoiceGuidedEntryWizard: React.FC<VoiceGuidedEntryWizardProps> = ({
  onSave,
  onCancel,
  conversationState,
  isVoiceActive
}) => {
  const [steps, setSteps] = useState<VoiceStep[]>([
    { id: 'title', title: 'Entry Title', question: 'What would you like to call this entry?', completed: false, current: true },
    { id: 'category', title: 'Category', question: 'What category should this entry be in?', completed: false, current: false },
    { id: 'fields', title: 'Custom Fields', question: 'Would you like to add any custom fields?', completed: false, current: false },
    { id: 'preview', title: 'Preview & Save', question: 'Review your entry and save', completed: false, current: false }
  ]);

  const [entryData, setEntryData] = useState({
    title: '',
    category: 'Personal',
    customFields: [] as Array<{ name: string; type: string; value: string }>
  });

  const [lastVoiceInput, setLastVoiceInput] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Update steps based on conversation state
  useEffect(() => {
    if (conversationState?.currentStep) {
      const stepType = conversationState.currentStep.type;
      console.log('🧭 Wizard step update - Current step type:', stepType);
      console.log('🧭 Wizard current steps state:', steps.map(s => ({ id: s.id, current: s.current, completed: s.completed })));
      
      setSteps(prev => prev.map(step => {
        // Map conversation step types to wizard step IDs
        const isCurrentStep = 
          (stepType === 'title' && step.id === 'title') ||
          (stepType === 'category' && step.id === 'category') ||
          (['more_fields', 'field_name', 'field_type'].includes(stepType) && step.id === 'fields') ||
          (stepType === 'preview' && step.id === 'preview');
        
        return {
          ...step,
          current: isCurrentStep
        };
      }));
      
      setLastVoiceInput(conversationState.currentStep.question);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 1000);
      
      console.log('🧭 Updated wizard steps after conversation state change');
    } else {
      console.log('🎤 VoiceGuidedEntryWizard: No current step in conversation state');
    }
  }, [conversationState]);

  // Update entry data from conversation draft
  useEffect(() => {
    if (conversationState?.entryDraft) {
      const draft = conversationState.entryDraft;
      console.log('🎤 VoiceGuidedEntryWizard: Updating entry data from draft:', draft);
      
      const newEntryData = {
        ...entryData,
        title: draft.title || entryData.title,
        category: draft.category || entryData.category,
        customFields: draft.fields?.map((field: any, index: number) => ({
          name: field.name,
          type: field.type,
          value: ''
        })) || entryData.customFields
      };
      
      console.log('🎤 VoiceGuidedEntryWizard: Setting new entry data:', newEntryData);
      setEntryData(newEntryData);

      // Mark completed steps
      setSteps(prev => prev.map(step => {
        if (step.id === 'title' && draft.title) {
          return { ...step, completed: true, data: draft.title };
        }
        if (step.id === 'category' && draft.category) {
          return { ...step, completed: true, data: draft.category };
        }
        if (step.id === 'fields' && draft.fields?.length > 0) {
          return { ...step, completed: true, data: `${draft.fields.length} field(s)` };
        }
        return step;
      }));
    }
  }, [conversationState?.entryDraft]);

  const currentStepIndex = steps.findIndex(step => step.current);
  const progressPercentage = ((steps.filter(step => step.completed).length) / steps.length) * 100;

  const handleManualSave = () => {
    const entry = {
      title: entryData.title || `New Entry - ${new Date().toLocaleDateString()}`,
      fields: {
        category: entryData.category,
        description: '',
        ...Object.fromEntries(entryData.customFields.map(field => [field.name, field.value]))
      },
      fieldDefinitions: [
        { id: 'category', name: 'category', type: 'text' as const },
        { id: 'description', name: 'description', type: 'textarea' as const },
        ...entryData.customFields.map((field, index) => ({
          id: `field_${Date.now()}_${index}`,
          name: field.name,
          type: field.type as 'text' | 'number' | 'date' | 'textarea'
        }))
      ]
    };

    setShowSuccess(true);
    setTimeout(() => {
      onSave(entry);
    }, 1500);
  };

  if (showSuccess) {
    return (
      <Card className="max-w-md mx-auto mt-8 animate-scale-in">
        <CardContent className="text-center p-8">
          <div className="mb-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto animate-bounce" />
          </div>
          <h3 className="text-xl font-semibold text-green-700 mb-2">
            Entry Saved Successfully!
          </h3>
          <p className="text-muted-foreground">
            Your entry "{entryData.title}" has been created.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 animate-fade-in">
      {/* Header with Voice Status */}
      <Card className={`border-2 transition-all duration-500 ${
        isVoiceActive ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-border'
      }`}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Sparkles className="h-6 w-6 text-primary" />
              <CardTitle className="text-xl">Voice-Guided Entry Creation</CardTitle>
            </div>
            <VoiceStatusIndicator
              connectionStatus="connected"
              isVoiceProcessing={isAnimating}
              conversationState={conversationState?.isInConversation ? 'listening' : 'idle'}
              hasPendingConfirmation={false}
            />
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progress</span>
              <span className="transition-all duration-300">{Math.round(progressPercentage)}% Complete</span>
            </div>
            <Progress value={progressPercentage} className="h-3 transition-all duration-500" />
          </div>
        </CardHeader>
      </Card>

      {/* Steps Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {steps.map((step, index) => (
          <Card key={step.id} className={`transition-all duration-300 ${
            step.current ? 'ring-2 ring-primary border-primary shadow-lg' : 
            step.completed ? 'border-green-500 bg-green-50 dark:bg-green-950' : 
            'border-border'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 mb-2">
                {step.completed ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : step.current ? (
                  <div className="h-5 w-5 rounded-full bg-primary animate-pulse" />
                ) : (
                  <div className="h-5 w-5 rounded-full border border-muted-foreground" />
                )}
                <span className={`font-medium text-sm ${
                  step.current ? 'text-primary' : 
                  step.completed ? 'text-green-700 dark:text-green-300' : 
                  'text-muted-foreground'
                }`}>
                  {step.title}
                </span>
              </div>
              {step.completed && step.data && (
                <Badge variant="secondary" className="text-xs">
                  {step.data}
                </Badge>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Current Step Content */}
      <Card className="border-2 border-primary/50">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Volume2 className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">
              {steps[currentStepIndex]?.title || 'Voice Interaction'}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Voice Question Display */}
          {lastVoiceInput && (
            <div className={`p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800 transition-all duration-500 ${
              isAnimating ? 'animate-pulse' : ''
            }`}>
              <p className="text-blue-800 dark:text-blue-200 font-medium">
                <TypewriterText text={lastVoiceInput} />
              </p>
            </div>
          )}

          {/* Live Voice Feedback Component */}
          <VoiceLiveFeedback
            title={entryData.title}
            category={entryData.category}
            fields={entryData.customFields}
            currentStep={steps.find(s => s.current)?.id}
            isListening={isVoiceActive && conversationState?.isInConversation}
          />

          {/* Debug Display */}
          <div className="p-3 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/30">
            <p className="text-xs text-muted-foreground mb-2">📝 Entry Title: {entryData.title || 'Not set'}</p>
            <p className="text-xs text-muted-foreground mb-2">🏷️ Category: {entryData.category}</p>
            <p className="text-xs text-muted-foreground">🧭 Current Step: {steps.find(s => s.current)?.id || 'None'}</p>
          </div>

          {/* Conditional Content Based on Step */}
          {steps.find(s => s.id === 'preview')?.current ? (
            /* Preview Step - Detailed Entry Overview */
            <div className="space-y-6">
              <div className="flex items-center space-x-2 mb-4">
                <Eye className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-foreground">Preview Your Entry</h3>
              </div>
              
              {/* Detailed entry preview */}
              <div className="space-y-4 p-6 bg-accent/5 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Title</Label>
                    <div className="p-3 bg-background border border-border rounded-md">
                      <span className="text-foreground font-medium">{entryData.title || 'Untitled Entry'}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-muted-foreground">Category</Label>
                    <div className="p-3 bg-background border border-border rounded-md">
                      <span className="text-foreground">{entryData.category}</span>
                    </div>
                  </div>
                  
                  {entryData.customFields && entryData.customFields.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-muted-foreground">Custom Fields</Label>
                      <div className="space-y-2">
                        {entryData.customFields.map((field, index) => (
                          <div key={index} className="p-3 bg-background border border-border rounded-md">
                            <div className="flex items-center justify-between">
                              <span className="text-foreground font-medium">{field.name}</span>
                              <Badge variant="outline" className="text-xs">{field.type}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-foreground font-medium mb-2">Ready to save this entry?</p>
                <p className="text-sm text-muted-foreground">
                  Say <strong>"save"</strong> to create your entry or <strong>"edit"</strong> to make changes
                </p>
              </div>
            </div>
          ) : (
            /* Regular Wizard Steps */
            <div className="space-y-6">
              {/* Entry Input Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Title Section */}
                <div className={`space-y-2 transition-all duration-300 ${
                  steps.find(s => s.id === 'title')?.current ? 'animate-pulse ring-2 ring-blue-500/50 rounded-lg p-3' : ''
                }`}>
                  <Label htmlFor="preview-title">Entry Title</Label>
                  <Input
                    id="preview-title"
                    value={entryData.title}
                    onChange={(e) => setEntryData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter your entry title..."
                    className={`transition-all duration-300 ${
                      steps.find(s => s.id === 'title')?.current ? 'border-blue-500 ring-1 ring-blue-500/30' : ''
                    }`}
                    disabled={conversationState?.isInConversation}
                  />
                </div>

                {/* Category Section */}
                <div className={`space-y-2 transition-all duration-300 ${
                  steps.find(s => s.id === 'category')?.current ? 'animate-pulse ring-2 ring-blue-500/50 rounded-lg p-3' : ''
                }`}>
                  <Label>Category</Label>
                  <CategorySelector
                    selectedCategory={entryData.category}
                    onCategoryChange={(category) => setEntryData(prev => ({ ...prev, category }))}
                    isReadonly={conversationState?.isInConversation}
                    categories={['Documents', 'Health', 'Contacts', 'Finance', 'Personal']}
                    highlightedField={steps.find(s => s.id === 'category')?.current ? 'category' : null}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Custom Fields Section */}
          {entryData.customFields.length > 0 && (
            <div className={`space-y-4 transition-all duration-300 ${
              steps.find(s => s.id === 'fields')?.current ? 'animate-pulse ring-2 ring-blue-500/50 rounded-lg p-3' : ''
            }`}>
              <div className="flex items-center space-x-2">
                <Plus className="h-4 w-4 text-primary" />
                <Label>Custom Fields</Label>
              </div>
              <div className="grid gap-3">
                {entryData.customFields.map((field, index) => (
                  <div 
                    key={index} 
                    className="p-3 border border-border rounded-lg bg-muted/50 animate-scale-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{field.name}</span>
                      <Badge variant="outline">{field.type}</Badge>
                    </div>
                    <Input
                      value={field.value}
                      onChange={(e) => {
                        const newFields = [...entryData.customFields];
                        newFields[index].value = e.target.value;
                        setEntryData(prev => ({ ...prev, customFields: newFields }));
                      }}
                      placeholder={`Enter ${field.name.toLowerCase()}...`}
                      className="mt-1"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t border-border">
            <Button variant="outline" onClick={onCancel}>
              Cancel Creation
            </Button>
            
            <div className="flex space-x-2">
              {/* Debug button for testing step advancement */}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  console.log('🔧 DEBUG: Force advancing to category step');
                  // This will help us test if the UI responds to step changes
                }}
              >
                🔧 Debug Step
              </Button>
              
              {!conversationState?.isInConversation && (
                <Button onClick={handleManualSave} className="space-x-2">
                  <Save className="h-4 w-4" />
                  <span>Save Entry Now</span>
                </Button>
              )}
            </div>
            
            {conversationState?.isInConversation && (
              <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                <Mic className="h-4 w-4 animate-pulse" />
                <span className="text-sm font-medium">Listening for your voice...</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instructions Card */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground text-center">
            🎤 <strong>Voice Commands:</strong> Say "create entry" to start, 
            speak naturally to answer each question, or say "cancel" to stop at any time.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};