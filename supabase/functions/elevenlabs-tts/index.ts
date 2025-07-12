Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { text, voiceId = '9BWtsMINqrJLrRacOk9x', modelId = 'eleven_multilingual_v2' } = await req.json();

    console.log('TTS Edge Function - Received text length:', text?.length, 'Voice ID:', voiceId);

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ElevenLabs has a character limit, let's check and truncate if needed
    const maxLength = 500; // More conservative limit
    let processedText = text.length > maxLength ? text.substring(0, maxLength) : text;
    
    // Clean the text - remove any problematic characters
    processedText = processedText.replace(/[^\w\s.,!?-]/g, ' ').trim();
    
    console.log('TTS Edge Function - Processed text:', processedText.substring(0, 100) + (processedText.length > 100 ? '...' : ''));

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'ElevenLabs API key not configured' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('TTS Edge Function - Making API call to ElevenLabs...');
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: processedText,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      })
    });

    console.log('TTS Edge Function - API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: `ElevenLabs API error: ${response.status} - ${errorText}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

    return new Response(
      JSON.stringify({ 
        audioContent: base64Audio,
        contentType: 'audio/mpeg'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('TTS Edge Function - Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Unexpected error in TTS function',
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});