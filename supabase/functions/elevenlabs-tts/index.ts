
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

    console.log('TTS Edge Function - Received request:', { 
      textLength: text?.length, 
      voiceId, 
      modelId 
    });

    if (!text || text.trim().length === 0) {
      console.error('TTS Edge Function - No text provided');
      return new Response(
        JSON.stringify({ error: 'Text is required and cannot be empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    if (!ELEVENLABS_API_KEY) {
      console.error('TTS Edge Function - No API key configured');
      return new Response(
        JSON.stringify({ 
          error: 'ElevenLabs API key not configured. Please set ELEVENLABS_API_KEY in environment variables.',
          fallback: 'browser_tts'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate and clean text
    const maxLength = 300; // Reduced to avoid quota issues
    let processedText = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    
    // Clean and normalize text
    processedText = processedText
      .replace(/\\"/g, '"')
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'")
      .replace(/[^\w\s.,!?'"()-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (processedText.length === 0) {
      console.error('TTS Edge Function - Text became empty after processing');
      return new Response(
        JSON.stringify({ 
          error: 'Text cannot be processed (empty after cleaning)',
          fallback: 'browser_tts'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('TTS Edge Function - Processing text:', {
      originalLength: text.length,
      processedLength: processedText.length,
      preview: processedText.substring(0, 50) + (processedText.length > 50 ? '...' : '')
    });

    console.log('TTS Edge Function - Making API call to ElevenLabs...');
    
    const requestBody = {
      text: processedText,
      model_id: modelId,
      voice_settings: {
        stability: 0.6,
        similarity_boost: 0.8,
        style: 0.0,
        use_speaker_boost: false // Disabled to reduce processing load
      }
    };

    console.log('TTS Edge Function - Request body prepared');

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify(requestBody)
    });

    console.log('TTS Edge Function - ElevenLabs response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('TTS Edge Function - ElevenLabs API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      let errorMessage = `ElevenLabs API error (${response.status})`;
      let fallbackRecommended = false;
      
      if (response.status === 401) {
        errorMessage = 'Invalid ElevenLabs API key - please check your configuration';
        fallbackRecommended = true;
      } else if (response.status === 402) {
        errorMessage = 'ElevenLabs account has insufficient credits or quota exceeded';
        fallbackRecommended = true;
      } else if (response.status === 403) {
        errorMessage = 'ElevenLabs API access forbidden - quota or permissions issue';
        fallbackRecommended = true;
      } else if (response.status === 429) {
        errorMessage = 'ElevenLabs rate limit exceeded - please try again later';
        fallbackRecommended = true;
      } else if (response.status === 422) {
        errorMessage = 'Invalid request parameters for ElevenLabs API';
      } else if (errorText) {
        try {
          const errorObj = JSON.parse(errorText);
          errorMessage = errorObj.detail || errorObj.message || errorText;
        } catch {
          errorMessage = errorText;
        }
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: errorText,
          status: response.status,
          fallback: fallbackRecommended ? 'browser_tts' : undefined
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const audioBuffer = await response.arrayBuffer();
    console.log('TTS Edge Function - Audio buffer size:', audioBuffer.byteLength);

    if (audioBuffer.byteLength === 0) {
      console.error('TTS Edge Function - Received empty audio buffer');
      return new Response(
        JSON.stringify({ 
          error: 'Received empty audio from ElevenLabs',
          fallback: 'browser_tts'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
    console.log('TTS Edge Function - Base64 audio length:', base64Audio.length);

    return new Response(
      JSON.stringify({ 
        audioContent: base64Audio,
        contentType: 'audio/mpeg',
        success: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('TTS Edge Function - Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        fallback: 'browser_tts',
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
