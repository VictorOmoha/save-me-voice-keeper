/**
 * Voice Processor Integration Tests
 * Tests the complete voice-to-data pipeline
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VoiceProcessor } from '../processors/VoiceProcessor';
import { VoiceContext } from '../types';

describe('VoiceProcessor', () => {
  let processor: VoiceProcessor;
  let mockContext: VoiceContext;

  beforeEach(() => {
    processor = new VoiceProcessor({ enableDebugMode: false });
    mockContext = {
      currentView: 'dashboard',
      availableEntries: [
        { id: '1', title: 'Shopping List', category: 'Personal' },
        { id: '2', title: 'Medical Records', category: 'Health' },
        { id: '3', title: 'Budget 2024', category: 'Finance' },
      ],
      previousCommands: [],
    };

    // Mock TTS state
    (window as any).__tts_is_speaking = false;
    (window as any).__last_tts_end_time = 0;
  });

  describe('Command Recognition', () => {
    it('should recognize create entry command', async () => {
      const result = await processor.processVoiceCommand('create a new entry', mockContext);

      expect(result.intent).toBe('create');
      expect(result.type).toBe('create_entry');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should recognize delete entry command', async () => {
      const result = await processor.processVoiceCommand('delete shopping list', mockContext);

      expect(result.intent).toBe('delete');
      expect(result.type).toBe('delete_entry');
      expect(result.needsConfirmation).toBe(true);
    });

    it('should recognize open entry command', async () => {
      const result = await processor.processVoiceCommand('open medical records', mockContext);

      expect(result.intent).toBe('edit');
      expect(result.type).toBe('open_entry');
      expect(result.parameters.entryId).toBe('2');
    });

    it('should recognize search command', async () => {
      const result = await processor.processVoiceCommand('search for budget', mockContext);

      expect(result.intent).toBe('search');
      expect(result.parameters.query).toContain('budget');
    });

    it('should recognize cancel command', async () => {
      const result = await processor.processVoiceCommand('cancel', mockContext);

      expect(result.intent).toBe('cancel');
    });
  });

  describe('Confirmation Flow', () => {
    it('should handle positive confirmation', async () => {
      // First trigger a delete command
      await processor.processVoiceCommand('delete shopping list', mockContext);

      expect(processor.hasPendingConfirmation()).toBe(true);

      // Now confirm
      const result = await processor.processVoiceCommand('yes', mockContext);

      expect(result.parameters.confirmed).toBe(true);
      expect(processor.hasPendingConfirmation()).toBe(false);
    });

    it('should handle negative confirmation', async () => {
      // First trigger a delete command
      await processor.processVoiceCommand('delete shopping list', mockContext);

      expect(processor.hasPendingConfirmation()).toBe(true);

      // Now cancel
      const result = await processor.processVoiceCommand('no', mockContext);

      expect(result.intent).toBe('cancel');
      expect(processor.hasPendingConfirmation()).toBe(false);
    });

    it('should handle confirmation timeout', async () => {
      // Create processor with short timeout for testing
      const fastProcessor = new VoiceProcessor({
        confirmationTimeout: 100,
        enableDebugMode: false,
      });

      await fastProcessor.processVoiceCommand('delete shopping list', mockContext);
      expect(fastProcessor.hasPendingConfirmation()).toBe(true);

      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(fastProcessor.hasPendingConfirmation()).toBe(false);
    });
  });

  describe('Entry Matching', () => {
    it('should find exact title match', async () => {
      const result = await processor.processVoiceCommand('open shopping list', mockContext);

      expect(result.parameters.entryId).toBe('1');
      expect(result.parameters.entryTitle).toBe('Shopping List');
    });

    it('should find partial title match', async () => {
      const result = await processor.processVoiceCommand('open medical', mockContext);

      expect(result.parameters.entryId).toBe('2');
    });

    it('should handle no match gracefully', async () => {
      const result = await processor.processVoiceCommand('open nonexistent entry', mockContext);

      expect(result.confidence).toBeLessThan(0.8);
    });
  });

  describe('TTS Feedback Filtering', () => {
    it('should filter out TTS feedback when TTS is speaking', async () => {
      (window as any).__tts_is_speaking = true;

      const result = await processor.processVoiceCommand('create entry', mockContext);

      expect(result.intent).toBe('unknown');
      expect(result.parameters.action).toBe('tts_feedback_blocked');
    });

    it('should allow commands when TTS is not speaking', async () => {
      (window as any).__tts_is_speaking = false;

      const result = await processor.processVoiceCommand('create entry', mockContext);

      expect(result.intent).toBe('create');
    });
  });

  describe('Reset/Escape Commands', () => {
    it('should handle start over command', async () => {
      // Set up pending confirmation
      await processor.processVoiceCommand('delete shopping list', mockContext);
      expect(processor.hasPendingConfirmation()).toBe(true);

      // Say start over
      const result = await processor.processVoiceCommand('start over', mockContext);

      expect(result.intent).toBe('conversation');
      expect(processor.hasPendingConfirmation()).toBe(false);
    });

    it('should handle reset command', async () => {
      await processor.processVoiceCommand('delete shopping list', mockContext);

      const result = await processor.processVoiceCommand('reset', mockContext);

      expect(processor.hasPendingConfirmation()).toBe(false);
    });
  });
});
