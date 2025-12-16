import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.2";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// HTML escape function to prevent XSS attacks
function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SupportEmailRequest {
  subject: string;
  message: string;
  category: string;
  userEmail: string;
  userName: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    // Create Supabase client to verify the user
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { subject, message, category, userEmail, userName }: SupportEmailRequest = await req.json();

    // Validate required fields
    if (!subject || !message || !category) {
      throw new Error("Missing required fields");
    }

    // Escape all user inputs to prevent XSS/HTML injection
    const safeUserName = escapeHtml(userName || 'Unknown');
    const safeUserEmail = escapeHtml(userEmail || user.email || '');
    const safeCategory = escapeHtml(category);
    const safeSubject = escapeHtml(subject);
    const safeMessage = escapeHtml(message).replace(/\n/g, '<br>');

    // Format the email content with escaped values
    const emailContent = `
      <h2>New Support Request</h2>
      <p><strong>From:</strong> ${safeUserName} (${safeUserEmail})</p>
      <p><strong>Category:</strong> ${safeCategory}</p>
      <p><strong>Subject:</strong> ${safeSubject}</p>
      <hr>
      <h3>Message:</h3>
      <p>${safeMessage}</p>
      <hr>
      <p><em>User ID: ${user.id}</em></p>
      <p><em>Submitted at: ${new Date().toISOString()}</em></p>
    `;

    const emailResponse = await resend.emails.send({
      from: "Support <noreply@saveme.space>",
      to: ["info@saveme.space"],
      subject: `Support Request: ${safeSubject}`,
      html: emailContent,
      reply_to: userEmail || user.email,
    });

    console.log("Support email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data?.id }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-support-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: error.message === "Unauthorized" ? 401 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);