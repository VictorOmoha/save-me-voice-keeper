
Deno.serve(async (req) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        let requestData;
        try {
            const bodyText = await req.text();
            if (!bodyText || bodyText.trim() === '') {
                throw new Error('Empty request body');
            }
            requestData = JSON.parse(bodyText);
        } catch (parseError) {
            console.error('Google Cloud TTS - JSON parse error:', parseError);
            return new Response(
                JSON.stringify({
                    error: 'Invalid JSON in request body',
                    details: parseError instanceof Error ? parseError.message : String(parseError),
                    fallback: 'browser_tts'
                }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const { text, voiceName = 'en-US-Neural2-F', languageCode = 'en-US' } = requestData;

        console.log('Google Cloud TTS - Received request:', {
            textLength: text?.length,
            voiceName,
            languageCode
        });

        if (!text || text.trim().length === 0) {
            return new Response(
                JSON.stringify({ error: 'Text is required and cannot be empty' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const GOOGLE_CLOUD_API_KEY = Deno.env.get('GOOGLE_CLOUD_API_KEY');
        if (!GOOGLE_CLOUD_API_KEY) {
            console.error('Google Cloud TTS - No API key configured');
            return new Response(
                JSON.stringify({
                    error: 'Google Cloud API key not configured. Please set GOOGLE_CLOUD_API_KEY in environment variables.',
                    fallback: 'browser_tts'
                }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Clean and normalize text
        const processedText = text
            .replace(/[^\w\s.,!?'"()-]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        if (processedText.length === 0) {
            return new Response(
                JSON.stringify({
                    error: 'Text cannot be processed (empty after cleaning)',
                    fallback: 'browser_tts'
                }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        console.log('Google Cloud TTS - Making API call...');

        const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_CLOUD_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                input: { text: processedText },
                voice: {
                    languageCode,
                    name: voiceName,
                },
                audioConfig: {
                    audioEncoding: 'MP3',
                },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Google Cloud TTS - API error:', {
                status: response.status,
                error: errorText
            });

            return new Response(
                JSON.stringify({
                    error: `Google Cloud TTS API error (${response.status})`,
                    details: errorText,
                    fallback: 'browser_tts'
                }),
                { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const data = await response.json();
        console.log('Google Cloud TTS - Success, audio content received');

        return new Response(
            JSON.stringify({
                audioContent: data.audioContent,
                success: true
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Google Cloud TTS - Unexpected error:', error);
        return new Response(
            JSON.stringify({
                error: 'Internal server error',
                details: error instanceof Error ? error.message : String(error),
                fallback: 'browser_tts'
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
