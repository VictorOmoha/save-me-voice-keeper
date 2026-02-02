/**
 * API Service Layer
 * Consolidated API access abstraction for Firebase Cloud Functions
 *
 * This layer provides a unified interface to backend functions.
 *
 * Configuration:
 * - Set VITE_CLOUD_FUNCTIONS_URL for Firebase Cloud Functions
 */

import { auth } from '@/lib/firebase';

// Backend configuration
const FIREBASE_FUNCTIONS_URL = import.meta.env.VITE_CLOUD_FUNCTIONS_URL || '';

// Get Firebase backend URL
const getBackendUrl = () => {
  if (FIREBASE_FUNCTIONS_URL) {
    return { type: 'firebase' as const, url: FIREBASE_FUNCTIONS_URL };
  }
  return null;
};

/**
 * Get authentication token for API requests
 */
const getAuthToken = async (): Promise<string | null> => {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;
  return currentUser.getIdToken();
};

/**
 * Base API request helper
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const backend = getBackendUrl();
  if (!backend) {
    throw new Error('No backend configured. Set VITE_CLOUD_FUNCTIONS_URL or VITE_SUPABASE_FUNCTIONS_URL');
  }

  const token = await getAuthToken();
  if (!token) {
    throw new Error('User not authenticated');
  }

  const url = `${backend.url}/${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// ============================================================================
// Text-to-Speech Services
// ============================================================================

export interface TTSRequest {
  text: string;
  voiceId?: string;
  modelId?: string;
}

export interface TTSResponse {
  audioContent: string; // Base64 encoded audio
}

/**
 * ElevenLabs Text-to-Speech
 */
export async function elevenLabsTTS(request: TTSRequest): Promise<TTSResponse> {
  return apiRequest<TTSResponse>('elevenlabsTts', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Google Cloud Text-to-Speech
 */
export async function googleCloudTTS(request: {
  text: string;
  voiceName?: string;
  languageCode?: string;
}): Promise<TTSResponse> {
  return apiRequest<TTSResponse>('googleCloudTts', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * MiniMax Text-to-Speech
 */
export async function minimaxTTS(request: {
  text: string;
  voice_id?: string;
  speed?: number;
  vol?: number;
  pitch?: number;
}): Promise<TTSResponse> {
  return apiRequest<TTSResponse>('minimaxTts', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

// ============================================================================
// Payment Services (Stripe)
// ============================================================================

export interface CheckoutRequest {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutResponse {
  sessionId: string;
  url: string;
}

/**
 * Create Stripe Checkout Session
 */
export async function createCheckoutSession(request: CheckoutRequest): Promise<CheckoutResponse> {
  return apiRequest<CheckoutResponse>('createCheckout', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

/**
 * Create Customer Portal Session
 */
export async function createCustomerPortal(returnUrl: string): Promise<{ url: string }> {
  return apiRequest<{ url: string }>('customerPortal', {
    method: 'POST',
    body: JSON.stringify({ returnUrl }),
  });
}

/**
 * Check Subscription Status
 */
export async function checkSubscription(): Promise<{ subscribed: boolean }> {
  return apiRequest<{ subscribed: boolean }>('checkSubscription', {
    method: 'POST',
  });
}

// ============================================================================
// AI Services
// ============================================================================

export interface BrainDumpRequest {
  text: string;
  mode: 'organize' | 'expand';
}

export interface BrainDumpResponse {
  enhancedText: string;
}

/**
 * Enhance Brain Dump with AI
 */
export async function enhanceBrainDump(request: BrainDumpRequest): Promise<BrainDumpResponse> {
  return apiRequest<BrainDumpResponse>('enhanceBrainDump', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

// ============================================================================
// Support Services
// ============================================================================

export interface SupportEmailRequest {
  subject: string;
  message: string;
  category?: string;
}

/**
 * Send Support Email
 */
export async function sendSupportEmail(request: SupportEmailRequest): Promise<{ success: boolean }> {
  return apiRequest<{ success: boolean }>('sendSupportEmail', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

// ============================================================================
// Voice Services
// ============================================================================

export interface VoiceToTextRequest {
  audio: string; // Base64 encoded audio
}

export interface VoiceToTextResponse {
  text: string;
}

/**
 * Voice to Text (Whisper)
 * Converts audio to text using OpenAI Whisper API
 */
export async function voiceToText(request: VoiceToTextRequest): Promise<VoiceToTextResponse> {
  return apiRequest<VoiceToTextResponse>('voiceToText', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export interface VoiceAIRequest {
  transcript: string;
  context?: {
    currentView?: string;
    availableEntries?: Array<{ id: string; title: string; category: string }>;
    currentEntry?: { id: string; title: string };
    previousCommands?: string[];
  };
}

export interface VoiceAIResponse {
  intent: string;
  action: string;
  confidence: number;
  parameters: Record<string, any>;
  needsConfirmation: boolean;
  conversationalResponse: string;
  followUpQuestions?: string[];
}

/**
 * Voice AI Processor
 * Processes voice commands using Gemini AI
 */
export async function processVoiceAI(request: VoiceAIRequest): Promise<VoiceAIResponse> {
  return apiRequest<VoiceAIResponse>('voiceAiProcessor', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

// ============================================================================
// Backend Status
// ============================================================================

/**
 * Get current backend configuration status
 */
export function getBackendStatus() {
  const backend = getBackendUrl();
  return {
    configured: backend !== null,
    type: backend?.type || null,
    url: backend?.url || null,
  };
}
