
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VoiceProcessingRequest {
  transcript: string;
  context?: {
    currentView?: string;
    availableEntries?: Array<{ id: string; title: string; category: string }>;
    currentEntry?: { id: string; title: string };
    previousCommands?: string[];
  };
}

interface ProcessedCommand {
  intent: 'create' | 'delete' | 'edit' | 'search' | 'navigate' | 'export' | 'bulk_operation' | 'form_fill' | 'conversation' | 'unknown';
  action: string;
  confidence: number;
  parameters: Record<string, unknown>;
  needsConfirmation: boolean;
  conversationalResponse: string;
  followUpQuestions?: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.error('Gemini API key not configured');
      return new Response(
        JSON.stringify({ 
          error: 'Gemini API key not configured',
          intent: 'unknown',
          action: 'error',
          confidence: 0,
          parameters: {},
          needsConfirmation: false,
          conversationalResponse: 'Sorry, the AI service is not configured. Please check the settings.'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { transcript, context }: VoiceProcessingRequest = await req.json();

    if (!transcript) {
      throw new Error('No transcript provided');
    }

    console.log('Processing voice command:', transcript);
    console.log('Context:', context);

    // Create a detailed prompt for Gemini to understand voice commands
    const systemPrompt = `You are an intelligent voice assistant for "Save Me", a personal information management app. Your job is to interpret natural language voice commands and convert them into structured actions.

AVAILABLE ACTIONS:
1. CREATE - Create new entries, fields, or categories
2. DELETE - Delete entries (with confirmation for safety)
3. EDIT - Open/modify existing entries
4. SEARCH - Find specific entries or information
5. NAVIGATE - Change views, go to categories, etc.
6. EXPORT - Export data to various formats
7. BULK_OPERATION - Perform actions on multiple entries
8. FORM_FILL - Fill forms with voice-dictated data
9. CONVERSATION - General conversation and help

CONTEXT AWARENESS:
- Current entries: ${JSON.stringify(context?.availableEntries || [])}
- Current view: ${context?.currentView || 'dashboard'}
- Current entry: ${context?.currentEntry ? context.currentEntry.title : 'none'}

RESPONSE FORMAT:
Return a JSON object with these fields:
- intent: The primary action category
- action: Specific action to perform
- confidence: 0-1 confidence score
- parameters: Object with extracted parameters
- needsConfirmation: Boolean if action needs user confirmation
- conversationalResponse: Natural language response to user
- followUpQuestions: Array of suggested clarifying questions if needed

EXAMPLES:
"Create a new medical record for Dr. Smith visit yesterday"
{
  "intent": "create",
  "action": "create_entry",
  "confidence": 0.9,
  "parameters": {
    "title": "Dr. Smith Visit",
    "category": "Health",
    "date": "yesterday",
    "type": "medical_record"
  },
  "needsConfirmation": false,
  "conversationalResponse": "I'll create a new medical record for your Dr. Smith visit. What details would you like me to add?",
  "followUpQuestions": ["What was the purpose of the visit?", "Any important notes or prescriptions?"]
}

"Delete all entries older than 2 years"
{
  "intent": "bulk_operation",
  "action": "bulk_delete",
  "confidence": 0.8,
  "parameters": {
    "criteria": "older_than",
    "timeframe": "2_years",
    "filter": "all"
  },
  "needsConfirmation": true,
  "conversationalResponse": "I found entries older than 2 years that can be deleted. This action cannot be undone. Would you like me to show you which entries will be deleted first?",
  "followUpQuestions": ["Would you like to see the list first?", "Should I exclude any specific categories?"]
}

Be conversational, helpful, and always prioritize user safety by requesting confirmation for destructive actions.

Process this voice command: "${transcript}"`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: systemPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 1,
          topP: 1,
          maxOutputTokens: 1000,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${error}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates[0].content.parts[0].text;

    console.log('AI Response:', aiResponse);

    // Parse the AI response
    let processedCommand: ProcessedCommand;
    try {
      processedCommand = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback to basic processing
      processedCommand = {
        intent: 'unknown',
        action: 'unknown',
        confidence: 0.1,
        parameters: {},
        needsConfirmation: false,
        conversationalResponse: 'I didn\'t quite understand that. Could you please rephrase your request?',
        followUpQuestions: ['Try saying something like "Create a new entry" or "Show me my documents"']
      };
    }

    // Add safety validation
    if (processedCommand.intent === 'delete' || processedCommand.intent === 'bulk_operation') {
      processedCommand.needsConfirmation = true;
    }

    return new Response(JSON.stringify(processedCommand), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in voice-ai-processor:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : String(error),
        intent: 'unknown',
        conversationalResponse: 'Sorry, I encountered an error processing your request. Please try again.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
