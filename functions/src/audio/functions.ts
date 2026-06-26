import * as functions from "firebase-functions";
import {GoogleAuth} from "google-auth-library";
import {withCors} from "../common/http";
import {verifyAuth} from "../common/auth";
import {fetchWithRetry} from "../common/fetchWithRetry";

export const transcribeAudio = functions.https.onRequest(
  withCors(async (req, res) => {
    const user = await verifyAuth(req);
    if (!user) {
      res.status(401).json({error: "Unauthorized"});
      return;
    }
    if (req.method !== "POST") {
      res.status(405).json({error: "Method not allowed"});
      return;
    }

    const {audioData, audioMimeType} = req.body;
    if (!audioData) {
      res.status(400).json({error: "audioData is required"});
      return;
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      res.status(500).json({error: "Gemini API key not configured"});
      return;
    }

    try {
      const transcribeRes = await fetchWithRetry(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
        {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({
            systemInstruction: {parts: [{text: `You are a speech-to-text transcription service. Your job: output the literal words spoken in the audio file, verbatim.

Rules:
- Output only the words you actually hear — nothing else.
- If the audio has no detectable speech (silence, noise only, music), output exactly: [NO_SPEECH]
- Do NOT guess. Do NOT fill in likely content. Do NOT use any phrases from your training data unless the speaker literally said those words.
- If you are unsure what was said, output [NO_SPEECH] rather than making something up.
- Short phrases are fine. Partial words are fine if that's what was said.
- No punctuation cleanup, no formatting, no commentary.`}]},
            contents: [{
              parts: [
                {inlineData: {mimeType: audioMimeType || "audio/webm", data: audioData}},
                {text: "Output the literal words spoken in this audio. If unclear or silent, output [NO_SPEECH]."},
              ],
            }],
            generationConfig: {maxOutputTokens: 2048, temperature: 0, topP: 0.1, topK: 1},
          }),
        },
        3,
        600
      );

      if (!transcribeRes.ok) {
        const errText = await transcribeRes.text();
        console.error("[transcribeAudio] Gemini error:", transcribeRes.status, errText.substring(0, 200));
        const isRateLimited = transcribeRes.status === 429;
        if (isRateLimited) {
          res.set("Retry-After", "30");
        }
        res.status(isRateLimited ? 429 : 500).json({
          error: isRateLimited ? "Transcription rate limited" : "Transcription failed",
          retryable: isRateLimited,
          retryAfterSeconds: isRateLimited ? 30 : undefined,
        });
        return;
      }

      const data = await transcribeRes.json();
      const transcript = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
      console.log("[transcribeAudio] Result:", JSON.stringify(transcript).substring(0, 200));

      // Detect hallucinations and explicit no-speech signals
      const isNoSpeech = !transcript ||
        transcript === "[NO_SPEECH]" ||
        transcript.toUpperCase() === "[NO_SPEECH]" ||
        transcript === "." ||
        transcript.length < 2;

      // Block exact matches of known Gemini training-data hallucinations
      const HALLUCINATION_PATTERNS = [
        /^i'?m going to go to the store\.?\s*i need to (get|buy) some milk\.?$/i,
        /^the quick brown fox jumps over the lazy dog\.?$/i,
        /^lorem ipsum/i,
      ];
      const isHallucination = HALLUCINATION_PATTERNS.some((re) => re.test(transcript));

      if (isNoSpeech || isHallucination) {
        console.log("[transcribeAudio] Filtered:", isHallucination ? "hallucination" : "no speech");
        res.json({transcript: "", detected: false});
      } else {
        res.json({transcript, detected: true});
      }
    } catch (error) {
      console.error("[transcribeAudio] Exception:", error);
      const message = error instanceof Error ? error.message : String(error);
      const isRateLimited = /429/.test(message);
      if (isRateLimited) {
        res.set("Retry-After", "30");
      }
      res.status(isRateLimited ? 429 : 500).json({
        error: isRateLimited ? "Transcription rate limited" : "Transcription failed",
        retryable: isRateLimited,
        retryAfterSeconds: isRateLimited ? 30 : undefined,
      });
    }
  })
);

/**
 * ElevenLabs Text-to-Speech Cloud Function
 */
export const elevenlabsTts = functions.https.onRequest(
  withCors(async (req, res) => {
    // Verify authentication
    const user = await verifyAuth(req);
    if (!user) {
      res.status(401).json({error: "Unauthorized"});
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({error: "Method not allowed"});
      return;
    }

    const {text, voiceId, modelId} = req.body;

    if (!text) {
      res.status(400).json({error: "Text is required"});
      return;
    }

    // Get API key from environment
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      res.status(500).json({error: "ElevenLabs API key not configured"});
      return;
    }

    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId || "pNInz6obpgDQGcFmaJgB"}`,
        {
          method: "POST",
          headers: {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": apiKey,
          },
          body: JSON.stringify({
            text,
            model_id: modelId || "eleven_turbo_v2",
            voice_settings: {
              stability: 0.7,
              similarity_boost: 0.9,
              style: 0.2,
              use_speaker_boost: true,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("ElevenLabs API error:", errorText);
        res.status(response.status).json({
          error: "ElevenLabs API error",
          details: errorText,
        });
        return;
      }

      const audioBuffer = await response.arrayBuffer();
      const base64Audio = Buffer.from(audioBuffer).toString("base64");

      res.json({audioContent: base64Audio});
    } catch (error) {
      console.error("ElevenLabs TTS error:", error);
      res.status(500).json({error: "Failed to generate speech"});
    }
  })
);

/**
 * Google Cloud Text-to-Speech Cloud Function
 */
export const googleCloudTts = functions.https.onRequest(
  withCors(async (req, res) => {
    // Verify authentication
    const user = await verifyAuth(req);
    if (!user) {
      res.status(401).json({error: "Unauthorized"});
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({error: "Method not allowed"});
      return;
    }

    const {text, voiceName, languageCode} = req.body;

    if (!text) {
      res.status(400).json({error: "Text is required"});
      return;
    }

    // Get API key from Firebase config
    const apiKey = process.env.GOOGLE_TTS_API_KEY;
    if (!apiKey) {
      res.status(500).json({error: "Google TTS API key not configured"});
      return;
    }

    try {
      const response = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            input: {text},
            voice: {
              languageCode: languageCode || "en-US",
              name: voiceName || "en-US-Neural2-F",
            },
            audioConfig: {
              audioEncoding: "MP3",
              speakingRate: 1.0,
              pitch: 0,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Google TTS API error:", errorText);
        res.status(response.status).json({
          error: "Google TTS API error",
          details: errorText,
        });
        return;
      }

      const data = await response.json();
      res.json({audioContent: data.audioContent});
    } catch (error) {
      console.error("Google TTS error:", error);
      res.status(500).json({error: "Failed to generate speech"});
    }
  })
);

/**
 * MiniMax Text-to-Speech Cloud Function
 */
export const minimaxTts = functions.https.onRequest(
  withCors(async (req, res) => {
    // Verify authentication
    const user = await verifyAuth(req);
    if (!user) {
      res.status(401).json({error: "Unauthorized"});
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({error: "Method not allowed"});
      return;
    }

    const {text, voice_id, speed, vol, pitch} = req.body;

    if (!text) {
      res.status(400).json({error: "Text is required"});
      return;
    }

    // Get API key (JWT token) from Firebase config
    const apiKey = process.env.MINIMAX_API_KEY;
    const groupId = process.env.MINIMAX_GROUP_ID;

    if (!apiKey || !groupId) {
      res.status(500).json({error: "MiniMax API credentials not configured"});
      return;
    }

    try {
      const response = await fetch(
        `https://api.minimax.chat/v1/t2a_v2?GroupId=${groupId}`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "speech-01-turbo",
            text,
            stream: false,
            voice_setting: {
              voice_id: voice_id || "male-qn-qingse",
              speed: speed || 1.0,
              vol: vol || 1.0,
              pitch: pitch || 0,
            },
            audio_setting: {
              sample_rate: 32000,
              bitrate: 128000,
              format: "mp3",
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("MiniMax API error:", errorText);
        res.status(response.status).json({
          error: "MiniMax API error",
          details: errorText,
        });
        return;
      }

      const data = await response.json();

      if (data.audio_file) {
        // MiniMax returns base64 encoded audio
        res.json({audioContent: data.audio_file});
      } else if (data.extra_info?.audio_file) {
        res.json({audioContent: data.extra_info.audio_file});
      } else {
        console.error("MiniMax response missing audio:", data);
        res.status(500).json({error: "No audio content in response"});
      }
    } catch (error) {
      console.error("MiniMax TTS error:", error);
      res.status(500).json({error: "Failed to generate speech"});
    }
  })
);

/**
 * Public Demo TTS - Rate-limited Google Cloud TTS proxy for landing page
 * No auth required, but limited to short texts and throttled per IP
 */
const demoRateLimitMap = new Map<string, { count: number; resetAt: number }>();

// Google Cloud TTS voice options for demo
const DEMO_VOICES: Record<string, { name: string; languageCode: string }> = {
  rachel: {name: "en-US-Studio-O", languageCode: "en-US"},       // Warm female
  adam: {name: "en-US-Studio-M", languageCode: "en-US"},          // Professional male
  aria: {name: "en-US-Neural2-F", languageCode: "en-US"},         // Expressive female
  josh: {name: "en-US-Neural2-D", languageCode: "en-US"},         // Deep male
};

export const demoTts = functions.https.onRequest(
  withCors(async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({error: "Method not allowed"});
      return;
    }

    // Rate limit: 10 requests per minute per IP
    const clientIp = req.ip || req.headers["x-forwarded-for"] || "unknown";
    const ipKey = typeof clientIp === "string" ? clientIp : String(clientIp);
    const now = Date.now();
    const limit = demoRateLimitMap.get(ipKey);

    if (limit && limit.resetAt > now) {
      if (limit.count >= 10) {
        res.status(429).json({error: "Rate limit exceeded. Try again in a minute."});
        return;
      }
      limit.count++;
    } else {
      demoRateLimitMap.set(ipKey, {count: 1, resetAt: now + 60000});
    }

    // Clean up old entries periodically
    if (demoRateLimitMap.size > 1000) {
      for (const [key, val] of demoRateLimitMap) {
        if (val.resetAt < now) demoRateLimitMap.delete(key);
      }
    }

    const {text, voice} = req.body;

    if (!text) {
      res.status(400).json({error: "Text is required"});
      return;
    }

    // Limit text length for demo (prevent abuse)
    if (text.length > 500) {
      res.status(400).json({error: "Text too long for demo (max 500 chars)"});
      return;
    }

    // Resolve voice name from friendly key or use default
    const voiceConfig = DEMO_VOICES[voice || "rachel"] || DEMO_VOICES.rachel;

    try {
      // Use Application Default Credentials (service account) — no API key needed
      const auth = new GoogleAuth({scopes: ["https://www.googleapis.com/auth/cloud-platform"]});
      const accessToken = await auth.getAccessToken();

      const response = await fetch(
        "https://texttospeech.googleapis.com/v1/text:synthesize",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            input: {text},
            voice: {
              languageCode: voiceConfig.languageCode,
              name: voiceConfig.name,
            },
            audioConfig: {
              audioEncoding: "MP3",
              speakingRate: 1.0,
              pitch: 0,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Demo TTS Google error:", response.status, errorText);
        res.status(response.status).json({error: "Google TTS API error", details: errorText});
        return;
      }

      const data = await response.json() as { audioContent?: string };

      // Google TTS returns base64 audioContent directly
      res.json({audioContent: data.audioContent});
    } catch (error) {
      console.error("Demo TTS error:", error);
      res.status(500).json({error: "Failed to generate speech"});
    }
  })
);

