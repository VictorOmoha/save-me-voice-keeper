/**
 * TTS Filter
 * Handles filtering of text-to-speech feedback to prevent feedback loops
 */

import { TTS_FEEDBACK_PATTERNS, SYSTEM_PHRASES, DEFAULT_CONFIG } from '../constants';

export class TTSFilter {
  private lastTTSPrompt: string = '';
  private debugMode: boolean;

  constructor(debugMode = false) {
    this.debugMode = debugMode;
  }

  /**
   * Check if the given text is likely TTS feedback
   */
  isTTSFeedback(text: string): boolean {
    const cleanText = text.toLowerCase().trim();

    if (this.debugMode) {
      console.log('🎤 TTSFilter: Checking transcript:', text);
      console.log('🤖 TTSFilter: Last TTS prompt:', this.lastTTSPrompt);
    }

    // Check if TTS is currently speaking (global flag)
    if (this.isTTSSpeaking()) {
      if (this.debugMode) console.log('🚫 TTSFilter: TTS currently speaking, blocking input');
      return true;
    }

    // Check if within grace period after TTS ended
    if (this.isWithinTTSGracePeriod()) {
      if (this.debugMode) console.log('🚫 TTSFilter: Within TTS grace period, blocking input');
      return true;
    }

    // Check against known TTS feedback patterns
    const isPatternMatch = TTS_FEEDBACK_PATTERNS.some(pattern => pattern.test(cleanText));
    if (isPatternMatch) {
      if (this.debugMode) console.log('🚫 TTSFilter: TTS pattern match detected, blocking');
      return true;
    }

    // Check against system phrases
    const isSystemPhrase = SYSTEM_PHRASES.some(phrase => cleanText.includes(phrase));
    if (isSystemPhrase) {
      if (this.debugMode) console.log('🚫 TTSFilter: System phrase detected, blocking');
      return true;
    }

    // Check for exact match with last TTS prompt
    if (this.lastTTSPrompt && cleanText === this.lastTTSPrompt.toLowerCase().trim()) {
      if (this.debugMode) console.log('🚫 TTSFilter: Exact TTS prompt match, blocking');
      return true;
    }

    // Check against recent TTS cache
    if (this.matchesRecentTTS(cleanText)) {
      if (this.debugMode) console.log('🚫 TTSFilter: Matches recent TTS, blocking');
      return true;
    }

    // Text too short to be meaningful
    if (cleanText.length < 2) {
      if (this.debugMode) console.log('🚫 TTSFilter: Text too short, blocking');
      return true;
    }

    if (this.debugMode) console.log('✅ TTSFilter: Text passed all filters');
    return false;
  }

  /**
   * Check if TTS is currently speaking
   */
  private isTTSSpeaking(): boolean {
    return !!(window as any).__tts_is_speaking;
  }

  /**
   * Check if within grace period after TTS ended
   */
  private isWithinTTSGracePeriod(): boolean {
    const lastTTSEnd = (window as any).__last_tts_end_time || 0;
    return Date.now() - lastTTSEnd < DEFAULT_CONFIG.TTS_GRACE_PERIOD;
  }

  /**
   * Check against recent TTS texts cache
   */
  private matchesRecentTTS(cleanText: string): boolean {
    const recentTTS = (window as any).__recent_tts_texts as string[] | undefined;
    if (!recentTTS) return false;

    return recentTTS.some(ttsText => {
      const similarity =
        cleanText.includes(ttsText.toLowerCase().substring(0, 15)) ||
        ttsText.toLowerCase().includes(cleanText.substring(0, 15));
      return similarity;
    });
  }

  /**
   * Set the last TTS prompt for filtering
   */
  setLastTTSPrompt(prompt: string): void {
    this.lastTTSPrompt = prompt.toLowerCase().trim();
  }

  /**
   * Clear the last TTS prompt
   */
  clearLastTTSPrompt(): void {
    this.lastTTSPrompt = '';
  }

  /**
   * Check if text is a simple confirmation response
   * These should be allowed even during confirmation states
   */
  isSimpleConfirmation(text: string): boolean {
    const cleanText = text.toLowerCase().trim();
    return /^(yes|no|yeah|yep|confirm|cancel)$/i.test(cleanText);
  }

  /**
   * Enable or disable debug mode
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }
}

// Singleton instance
export const ttsFilter = new TTSFilter();
