
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
            console.error('MiniMax TTS - JSON parse error:', parseError);
            return new Response(
                JSON.stringify({
                    error: 'Invalid JSON in request body',
                    details: parseError instanceof Error ? parseError.message : String(parseError),
                    fallback: 'browser_tts'
                }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const { text, voice_id = 'male-qn-qingse', speed = 1.0, vol = 1.0, pitch = 0 } = requestData;

        console.log('MiniMax TTS - Received request:', {
            textLength: text?.length,
            voice_id,
        });

        if (!text || text.trim().length === 0) {
            return new Response(
                JSON.stringify({ error: 'Text is required and cannot be empty' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const MINIMAX_API_KEY = Deno.env.get('MINIMAX_API_KEY');
        if (!MINIMAX_API_KEY) {
            console.error('MiniMax TTS - No API key configured');
            return new Response(
                JSON.stringify({
                    error: 'MiniMax API key (JWT) not configured. Please set MINIMAX_API_KEY in environment variables.',
                    fallback: 'browser_tts'
                }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Extract GroupId from JWT
        let groupId = '';
        try {
            const jwtParts = MINIMAX_API_KEY.split('.');
            if (jwtParts.length === 3) {
                // In Deno, atob works similarly to browser
                const payload = JSON.parse(atob(jwtParts[1]));
                groupId = payload.GroupID || payload.SubjectID || '';
                console.log('MiniMax TTS - Extracted GroupID:', groupId);
            }
        } catch (e) {
            console.warn('MiniMax TTS - Failed to extract GroupID from JWT:', e);
        }

        if (!groupId) {
            console.error('MiniMax TTS - Could not find GroupID in JWT');
            // We'll try to proceed without it, as some accounts might not need it in the body if it's in the JWT
        }

        const MINIMAX_API_URL = 'https://api.minimax.io/v1/t2a_v2';

        console.log('MiniMax TTS - Making API call...');

        const response = await fetch(MINIMAX_API_URL, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MINIMAX_API_KEY}`,
            },
            body: JSON.stringify({
                model: "speech-01",
                text: text,
                voice_id: voice_id,
                speed: speed,
                vol: vol,
                pitch: pitch,
                audio_sample_rate: 32000,
                bitrate: 128000,
                group_id: groupId
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('MiniMax TTS - API error:', {
                status: response.status,
                error: errorText
            });

            return new Response(
                JSON.stringify({
                    error: `MiniMax TTS API error (${response.status})`,
                    details: errorText,
                    fallback: 'browser_tts'
                }),
                { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // MiniMax v2 t2a API returns binary audio stream for MP3 if successful
        // But wait, the client code expects a base64 encoded string if it follows the Google Cloud pattern
        // Or if it's a stream, it needs to be handled differently.

        const contentType = response.headers.get('content-type') || '';

        if (contentType.includes('application/json')) {
            // Probably an error or metadata
            const data = await response.json();
            if (data.base_resp && data.base_resp.status_code !== 0) {
                return new Response(
                    JSON.stringify({
                        error: `MiniMax API status error: ${data.base_resp.status_msg}`,
                        details: data,
                        fallback: 'browser_tts'
                    }),
                    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }
            // If it's v2, it might return audio in data? No, v2 returns stream.
        }

        // Get the audio data as an ArrayBuffer
        const audioBuffer = await response.arrayBuffer();

        // Convert to base64 to match the pattern the frontend expects (same as google-cloud-tts)
        // In Deno, we use btoa(String.fromCharCode(...new Uint8Array(buffer)))
        const uint8 = new Uint8Array(audioBuffer);
        let binary = '';
        const len = uint8.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(uint8[i]);
        }
        const base64Audio = btoa(binary);

        console.log('MiniMax TTS - Success, audio content converted to base64');

        return new Response(
            JSON.stringify({
                audioContent: base64Audio,
                success: true
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('MiniMax TTS - Unexpected error:', error);
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
