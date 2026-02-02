/**
 * API Service Layer
 * Consolidated API access abstraction for backend services
 *
 * This layer provides a unified interface to backend functions,
 * whether they run on Firebase Cloud Functions or Supabase Edge Functions.
 *
 * Configuration:
 * - Set VITE_CLOUD_FUNCTIONS_URL for Firebase Cloud Functions
 * - Set VITE_SUPABASE_FUNCTIONS_URL for Supabase Edge Functions (fallback)
 *
 * Priority: Firebase > Supabase
 */

import { auth } from '@/lib/firebase';

// Backend configuration
const FIREBASE_FUNCTIONS_URL = import.meta.env.VITE_CLOUD_FUNCTIONS_URL || '';
const SUPABASE_FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || '';

// Use Firebase if configured, otherwise fall back to Supabase
const getBackendUrl = () => {
  if (FIREBASE_FUNCTIONS_URL) {
    return { type: 'firebase' as const, url: FIREBASE_FUNCTIONS_URL };
  }
  if (SUPABASE_FUNCTIONS_URL) {
    return { type: 'supabase' as const, url: SUPABASE_FUNCTIONS_URL };
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
