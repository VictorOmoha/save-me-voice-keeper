
import { describe, it, expect, beforeEach } from 'vitest';
import { CommandRouter } from '../commandRouter';
import { Intent } from '../intentRecognizer';
import { ValidationResult } from '../parameterValidator';

describe('CommandRouter', () => {
  let router: CommandRouter;

  beforeEach(() => {
    router = new CommandRouter();
  });

  const createMockIntent = (name: string, params: Record<string, unknown> = {}): Intent => ({
    name,
    confidence: 0.8,
    parameters: params,
    requiredParameters: [],
    optionalParameters: []
  });

  const createMockValidation = (isValid: boolean = true, params: Record<string, unknown> = {}): ValidationResult => ({
    isValid,
    errors: isValid ? [] : ['Validation error'],
    validatedParameters: params
  });

  describe('Basic Routing', () => {
    it('should route create entry command', async () => {
      const intent = createMockIntent('create_entry', { title: 'Test Entry' });
      const validation = createMockValidation(true, { title: 'Test Entry' });

      const result = await router.route(intent, validation);

      expect(result.success).toBe(true);
      expect(result.result?.action).toBe('create_entry');
      expect(result.result?.title).toBe('Test Entry');
    });

    it('should route delete entry command with confirmation', async () => {
      const intent = createMockIntent('delete_entry', { target: 'test document' });
      const validation = createMockValidation(true, { target: 'test document' });

      const result = await router.route(intent, validation);

      expect(result.success).toBe(true);
      expect(result.result?.action).toBe('delete_entry');
      expect(result.result?.needsConfirmation).toBe(true);
    });

    it('should route search command', async () => {
      const intent = createMockIntent('search_entries', { query: 'medical records' });
      const validation = createMockValidation(true, { query: 'medical records' });

      const result = await router.route(intent, validation);

      expect(result.success).toBe(true);
      expect(result.result?.action).toBe('search_entries');
      expect(result.result?.query).toBe('medical records');
    });
  });

  describe('Validation Handling', () => {
    it('should fail routing with invalid validation', async () => {
      const intent = createMockIntent('create_entry');
      const validation = createMockValidation(false);

      const result = await router.route(intent, validation);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Validation failed');
      expect(result.suggestions).toBeDefined();
    });
  });

  describe('Unknown Intents', () => {
    it('should handle unknown intent gracefully', async () => {
      const intent = createMockIntent('unknown_intent');
      const validation = createMockValidation(true);

      const result = await router.route(intent, validation);

      expect(result.success).toBe(false);
      expect(result.error).toContain('No handler found');
      expect(result.suggestions).toBeDefined();
    });
  });

  describe('Middleware System', () => {
    it('should run middleware before routing', async () => {
      let middlewareRan = false;
      
      router.addMiddleware(async (intent, context) => {
        middlewareRan = true;
        return true; // Allow continuation
      });

      const intent = createMockIntent('create_entry');
      const validation = createMockValidation(true);

      await router.route(intent, validation);

      expect(middlewareRan).toBe(true);
    });

    it('should block routing when middleware returns false', async () => {
      router.addMiddleware(async (intent, context) => {
        return false; // Block execution
      });

      const intent = createMockIntent('create_entry');
      const validation = createMockValidation(true);

      const result = await router.route(intent, validation);

      expect(result.success).toBe(false);
      expect(result.error).toContain('blocked by middleware');
    });
  });

  describe('Custom Actions', () => {
    it('should allow registering custom actions', async () => {
      router.registerAction({
        intent: 'custom_action',
        handler: async (params) => ({ custom: true, params }),
        description: 'Custom test action',
        examples: ['custom command']
      });

      const intent = createMockIntent('custom_action', { test: 'value' });
      const validation = createMockValidation(true, { test: 'value' });

      const result = await router.route(intent, validation);

      expect(result.success).toBe(true);
      expect(result.result?.custom).toBe(true);
    });
  });

  describe('Help System', () => {
    it('should provide help information', async () => {
      const intent = createMockIntent('help');
      const validation = createMockValidation(true);

      const result = await router.route(intent, validation);

      expect(result.success).toBe(true);
      expect(result.result?.message).toContain('Available voice commands');
    });
  });

  describe('Action Management', () => {
    it('should return available actions', () => {
      const actions = router.getAvailableActions();
      expect(actions.length).toBeGreaterThan(0);
      expect(actions[0]).toHaveProperty('intent');
      expect(actions[0]).toHaveProperty('description');
    });

    it('should categorize actions', () => {
      const categories = router.getActionsByCategory();
      expect(categories).toHaveProperty('Content Management');
      expect(categories).toHaveProperty('Navigation');
      expect(categories).toHaveProperty('Data Export');
      expect(categories).toHaveProperty('System');
    });
  });

  describe('Error Handling', () => {
    it('should handle handler errors gracefully', async () => {
      router.registerAction({
        intent: 'error_action',
        handler: async () => {
          throw new Error('Test error');
        },
        description: 'Action that throws error',
        examples: ['error command']
      });

      const intent = createMockIntent('error_action');
      const validation = createMockValidation(true);

      const result = await router.route(intent, validation);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Test error');
    });
  });
});
