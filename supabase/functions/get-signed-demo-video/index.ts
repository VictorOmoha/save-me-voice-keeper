import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function extractPathFromUrl(input: string): string | null {
  try {
    const url = new URL(input);
    const parts = url.pathname.split('/').filter(Boolean);
    // Find the bucket name in the path and return the remainder
    const bucketIdx = parts.findIndex((p) => p === 'demo-videos');
    if (bucketIdx !== -1 && bucketIdx + 1 < parts.length) {
      return decodeURIComponent(parts.slice(bucketIdx + 1).join('/'));
    }
    return null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url, path, expiresIn = 600 } = await req.json();

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: 'Supabase environment not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    let objectPath: string | null = path || null;
    if (!objectPath && url) {
      objectPath = extractPathFromUrl(url);
    }

    if (!objectPath) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid video path/url' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Basic safety: prevent path traversal
    if (objectPath.includes('..')) {
      return new Response(
        JSON.stringify({ error: 'Invalid path' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the path corresponds to an active demo video entry
    console.log('Looking for video with path:', objectPath);
    
    const { data: videoRows, error: videoErr } = await admin
      .from('demo_videos')
      .select('id, video_url, is_active, video_type')
      .eq('is_active', true);

    console.log('All active videos found:', videoRows);

    if (videoErr) {
      console.error('Error verifying demo video:', videoErr);
      return new Response(
        JSON.stringify({ error: 'Verification error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find the video that matches this path (handle URL encoding)
    const matchingVideo = videoRows?.find(video => {
      const videoPath = extractPathFromUrl(video.video_url);
      console.log('Comparing paths:', { objectPath, videoPath, originalUrl: video.video_url });
      return videoPath === objectPath || decodeURIComponent(videoPath || '') === objectPath || videoPath === decodeURIComponent(objectPath);
    });

    if (!matchingVideo) {
      console.log('No matching video found for path:', objectPath);
      return new Response(
        JSON.stringify({ error: 'Video not found or not active' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Found matching video:', matchingVideo);

    // Create a signed URL for the object in the private bucket
    const { data: signed, error: signErr } = await admin
      .storage
      .from('demo-videos')
      .createSignedUrl(objectPath, expiresIn);

    if (signErr) {
      console.error('Error creating signed URL:', signErr);
      return new Response(
        JSON.stringify({ error: 'Failed to create signed URL' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ signedUrl: signed?.signedUrl, expiresIn }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('get-signed-demo-video error:', e);
    return new Response(
      JSON.stringify({ error: 'Unexpected error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
