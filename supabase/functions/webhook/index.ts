
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WebhookPayload {
  action: 'create_entry' | 'get_entries' | 'update_entry' | 'delete_entry';
  data?: any;
  entry_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Extract and validate API key from Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid Authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const apiKey = authHeader.replace('Bearer ', '')
    
    // Hash the provided API key to compare with stored hash
    const encoder = new TextEncoder()
    const data = encoder.encode(apiKey)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const keyHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // Validate API key and get user
    const { data: apiKeyData, error: keyError } = await supabase
      .from('api_keys')
      .select('user_id, is_active, permissions')
      .eq('key_hash', keyHash)
      .eq('is_active', true)
      .single()

    if (keyError || !apiKeyData) {
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update last_used_at for the API key
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('key_hash', keyHash)

    const userId = apiKeyData.user_id
    const permissions = apiKeyData.permissions

    // Parse request body
    const payload: WebhookPayload = await req.json()

    // Handle different webhook actions
    switch (payload.action) {
      case 'create_entry':
        if (!permissions.includes('write')) {
          return new Response(
            JSON.stringify({ error: 'Insufficient permissions for write operation' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { data: newEntry, error: createError } = await supabase
          .from('entries')
          .insert({
            user_id: userId,
            title: payload.data?.title || 'Webhook Entry',
            fields: payload.data?.fields || {},
            field_definitions: payload.data?.field_definitions
          })
          .select()
          .single()

        if (createError) {
          return new Response(
            JSON.stringify({ error: 'Failed to create entry', details: createError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ success: true, entry: newEntry }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'get_entries':
        if (!permissions.includes('read')) {
          return new Response(
            JSON.stringify({ error: 'Insufficient permissions for read operation' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { data: entries, error: fetchError } = await supabase
          .from('entries')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (fetchError) {
          return new Response(
            JSON.stringify({ error: 'Failed to fetch entries', details: fetchError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ success: true, entries }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'update_entry':
        if (!permissions.includes('write')) {
          return new Response(
            JSON.stringify({ error: 'Insufficient permissions for write operation' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (!payload.entry_id) {
          return new Response(
            JSON.stringify({ error: 'entry_id is required for update operation' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { data: updatedEntry, error: updateError } = await supabase
          .from('entries')
          .update({
            title: payload.data?.title,
            fields: payload.data?.fields,
            field_definitions: payload.data?.field_definitions
          })
          .eq('id', payload.entry_id)
          .eq('user_id', userId)
          .select()
          .single()

        if (updateError) {
          return new Response(
            JSON.stringify({ error: 'Failed to update entry', details: updateError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ success: true, entry: updatedEntry }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'delete_entry':
        if (!permissions.includes('write')) {
          return new Response(
            JSON.stringify({ error: 'Insufficient permissions for write operation' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        if (!payload.entry_id) {
          return new Response(
            JSON.stringify({ error: 'entry_id is required for delete operation' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const { error: deleteError } = await supabase
          .from('entries')
          .delete()
          .eq('id', payload.entry_id)
          .eq('user_id', userId)

        if (deleteError) {
          return new Response(
            JSON.stringify({ error: 'Failed to delete entry', details: deleteError.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Entry deleted successfully' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Supported actions: create_entry, get_entries, update_entry, delete_entry' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
