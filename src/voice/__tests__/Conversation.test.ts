/**
 * Conversation Flow Tests
 * Tests the multi-turn conversation for guided entry creation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useConversation } from '../hooks/useConversation';
import { CONVERSATION_STEPS } from '../constants';

// Mock the speak function
vi.mock('@/utils/textToSpeech', () => ({
  speak: vi.fn(),
}));

// Mock the voice processor
vi.mock('../processors/VoiceProcessor', () => ({
  voiceProcessor: {
    setLastTTSPrompt: vi.fn(),
    clearConfirmationState: vi.fn(),
  },
}));

describe('useConversation', () => {
  const mockOnCreateEntry = vi.fn();
  const mockOnSaveEntry = vi.fn();
  const mockFormTitleSetter = vi.fn();
  const mockFormCategorySetter = vi.fn();
  const mockFormAddFieldFunction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset TTS state
    (window as any).__tts_is_speaking = false;
  });

  const renderConversationHook = () => {
    return renderHook(() =>
      useConversation({
        onCreateEntry: mockOnCreateEntry,
        onSaveEntry: mockOnSaveEntry,
        formTitleSetter: mockFormTitleSetter,
        formCategorySetter: mockFormCategorySetter,
        formAddFieldFunction: mockFormAddFieldFunction,
      })
    );
  };

  describe('Conversation Lifecycle', () => {
    it('should start conversation with initial state', () => {
      const { result } = renderConversationHook();

      expect(result.current.isInConversation).toBe(false);
      expect(result.current.conversationState.currentStep).toBeNull();
    });

    it('should start conversation when startConversation is called', async () => {
      const { result } = renderConversationHook();

      await act(async () => {
        result.current.startConversation();
      });

      expect(mockOnCreateEntry).toHaveBeenCalled();
      expect(result.current.isInConversation).toBe(true);
      expect(result.current.conversationState.currentStep?.type).toBe('title');
    });

    it('should end conversation when endConversation is called', async () => {
      const { result } = renderConversationHook();

      await act(async () => {
        result.current.startConversation();
      });

      await act(async () => {
        result.current.endConversation();
      });

      expect(result.current.isInConversation).toBe(false);
      expect(result.current.conversationState.currentStep).toBeNull();
    });
  });

  describe('Step Processing', () => {
    it('should process title step and move to category', async () => {
      const { result } = renderConversationHook();

      await act(async () => {
        result.current.startConversation();
      });

      // Wait for state to settle
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      await act(async () => {
        const processed = result.current.processStep('My Shopping List');
        expect(processed).toBe(true);
      });

      // Wait for state update
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(mockFormTitleSetter).toHaveBeenCalledWith('My Shopping List');
      expect(result.current.conversationState.entryDraft.title).toBe('My Shopping List');
      expect(result.current.conversationState.currentStep?.type).toBe('category');
    });

    it('should reject empty title', async () => {
      const { result } = renderConversationHook();

      await act(async () => {
        result.current.startConversation();
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      await act(async () => {
        const processed = result.current.processStep('');
        expect(processed).toBe(false);
      });

      expect(result.current.conversationState.currentStep?.type).toBe('title');
    });

    it('should process category step with valid category', async () => {
      const { result } = renderConversationHook();

      // Start and set title
      await act(async () => {
        result.current.startConversation();
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      await act(async () => {
        result.current.processStep('Test Entry');
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Now process category
      await act(async () => {
        const processed = result.current.processStep('Personal');
        expect(processed).toBe(true);
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(mockFormCategorySetter).toHaveBeenCalledWith('Personal');
      expect(result.current.conversationState.entryDraft.category).toBe('Personal');
    });

    it('should reject invalid category', async () => {
      const { result } = renderConversationHook();

      // Start and set title
      await act(async () => {
        result.current.startConversation();
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      await act(async () => {
        result.current.processStep('Test Entry');
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Try invalid category
      await act(async () => {
        const processed = result.current.processStep('InvalidCategory');
        expect(processed).toBe(false);
      });

      expect(result.current.conversationState.currentStep?.type).toBe('category');
    });
  });

  describe('TTS Feedback Filtering', () => {
    it('should ignore TTS feedback patterns', async () => {
      const { result } = renderConversationHook();

      await act(async () => {
        result.current.startConversation();
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Simulate TTS feedback being picked up
      await act(async () => {
        const processed = result.current.processStep('What would you like to call this entry?');
        expect(processed).toBe(false);
      });

      // Should still be on title step
      expect(result.current.conversationState.currentStep?.type).toBe('title');
    });
  });

  describe('State Getter', () => {
    it('should return current state via getState', async () => {
      const { result } = renderConversationHook();

      await act(async () => {
        result.current.startConversation();
      });

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      const state = result.current.getState();

      expect(state.isInConversation).toBe(true);
      expect(state.currentStep?.type).toBe('title');
    });
  });
});
