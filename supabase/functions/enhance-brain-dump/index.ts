import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ActionItem {
  text: string;
  priority?: 'high' | 'medium' | 'low';
  dueDate?: string;
  assignee?: string;
}

interface EnhancedBrainDump {
  title: string;
  summary: string;
  category: string;
  tags: string[];
  actionItems: ActionItem[];
  keyPoints: string[];
  notes: string[];
  people: string[];
  followUpQuestions?: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);

    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) throw new Error("OPENAI_API_KEY is not set");

    const { content } = await req.json();
    if (!content || typeof content !== 'string') {
      throw new Error("Content is required");
    }

    console.log("Enhancing brain dump for:", user.email, "content length:", content.length);

    const systemPrompt = `You are an intelligent assistant that processes brain dumps and voice notes into structured, actionable information.

Your task is to analyze the provided text and extract:
1. A concise, descriptive title (max 60 chars)
2. A brief summary (1-2 sentences)
3. The most appropriate category (one of: Work, Personal, Health, Finance, Documents, Ideas)
4. Relevant tags (3-5 keywords)
5. Action items with priority (high/medium/low) and due dates if mentioned
6. Key points - important facts or decisions
7. General notes - other relevant information
8. People mentioned by name
9. Optional: Follow-up questions if the content seems incomplete

For action items:
- Extract any tasks, to-dos, or things to remember
- Assign priority based on urgency words (urgent, ASAP = high; eventually, someday = low)
- Parse due dates from phrases like "by Friday", "tomorrow", "end of month"
- Identify assignees from phrases like "ask John", "for Sarah"

Respond ONLY with valid JSON matching this structure:
{
  "title": "string",
  "summary": "string",
  "category": "Work|Personal|Health|Finance|Documents|Ideas",
  "tags": ["string"],
  "actionItems": [{"text": "string", "priority": "high|medium|low", "dueDate": "YYYY-MM-DD or null", "assignee": "string or null"}],
  "keyPoints": ["string"],
  "notes": ["string"],
  "people": ["string"],
  "followUpQuestions": ["string"]
}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Please analyze and structure this brain dump:\n\n${content}` }
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content;

    if (!assistantMessage) {
      throw new Error("No response from AI");
    }

    // Parse the JSON response
    let enhanced: EnhancedBrainDump;
    try {
      // Remove markdown code blocks if present
      const cleanJson = assistantMessage
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      enhanced = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error("Failed to parse AI response:", assistantMessage);
      throw new Error("Failed to parse AI response");
    }

    console.log("Successfully enhanced brain dump:", enhanced.title);

    return new Response(JSON.stringify({ enhanced }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Enhance brain dump error:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
