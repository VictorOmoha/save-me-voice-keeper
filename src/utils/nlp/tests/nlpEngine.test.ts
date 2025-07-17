
import { describe, it, expect, beforeEach } from 'vitest';
import { NLPEngine } from '../nlpEngine';
import { RoutingContext } from '../commandRouter';

describe('NLPEngine', () => {
  let engine: NLPEngine;

  beforeEach(() => {
    engine = new NLPEngine({
      confidenceThreshold: 0.3,
      enableLogging: false
    });
  });

  describe('Intent Recognition', () => {
    it('should recognize create entry intent', async () => {
      const result = await engine.processText('create new entry');
      
      expect(result.intent.name).toBe('create_entry');
      expect(result.intent.confidence).toBeGreaterThan(0.5);
      expect(result.routing.success).toBe(true);
    });

    it('should recognize delete entry intent with target', async () => {
      const result = await engine.processText('delete medical record');
      
      expect(result.intent.name).toBe('delete_entry');
      expect(result.intent.parameters.target).toBe('medical record');
      expect(result.validation.isValid).toBe(true);
    });

    it('should recognize search intent with query', async () => {
      const result = await engine.processText('search for invoice documents');
      
      expect(result.intent.name).toBe('search_entries');
      expect(result.intent.parameters.query).toBe('invoice documents');
      expect(result.validation.isValid).toBe(true);
    });

    it('should recognize navigation intent', async () => {
      const result = await engine.processText('go to health category');
      
      expect(result.intent.name).toBe('navigate_view');
      expect(result.intent.parameters.destination).toBe('health category');
      expect(result.validation.isValid).toBe(true);
    });

    it('should recognize export intent with format', async () => {
      const result = await engine.processText('export to PDF');
      
      expect(result.intent.name).toBe('export_data');
      expect(result.intent.parameters.format).toBe('PDF');
      expect(result.validation.isValid).toBe(true);
    });
  });

  describe('Parameter Extraction', () => {
    it('should extract title from create command', async () => {
      const result = await engine.processText('create entry called "Medical Appointment"');
      
      expect(result.intent.parameters.title).toBe('Medical Appointment');
    });

    it('should extract category from context', async () => {
      const result = await engine.processText('create new health record');
      
      expect(result.intent.parameters.category).toBe('Health');
    });

    it('should extract search query properly', async () => {
      const result = await engine.processText('find all documents about taxes');
      
      expect(result.intent.parameters.query).toBe('all documents about taxes');
    });
  });

  describe('Parameter Validation', () => {
    it('should fail validation for delete without target', async () => {
      const result = await engine.processText('delete');
      
      expect(result.validation.isValid).toBe(false);
      expect(result.validation.errors).toContain("Required parameter 'target' is missing");
    });

    it('should fail validation for search without query', async () => {
      const result = await engine.processText('search');
      
      expect(result.validation.isValid).toBe(false);
      expect(result.validation.errors).toContain("Required parameter 'query' is missing");
    });

    it('should validate category values', async () => {
      const result = await engine.processText('create entry in invalid_category');
      
      // Should still be valid but category should default to Personal
      expect(result.validation.isValid).toBe(true);
      expect(result.validation.validatedParameters.category).toBe('Personal');
    });
  });

  describe('Command Routing', () => {
    it('should route create command successfully', async () => {
      const result = await engine.processText('create new medical entry');
      
      expect(result.routing.success).toBe(true);
      expect(result.routing.result?.action).toBe('create_entry');
      expect(result.routing.result?.category).toBe('Health');
    });

    it('should route delete command with confirmation needed', async () => {
      const result = await engine.processText('delete important document');
      
      expect(result.routing.success).toBe(true);
      expect(result.routing.result?.action).toBe('delete_entry');
      expect(result.routing.result?.needsConfirmation).toBe(true);
    });

    it('should handle unknown commands gracefully', async () => {
      const result = await engine.processText('do something completely unknown');
      
      expect(result.intent.name).toBe('unknown');
      expect(result.routing.success).toBe(false);
    });
  });

  describe('Context Handling', () => {
    it('should use context for enhanced processing', async () => {
      const context: RoutingContext = {
        userId: 'test-user',
        currentView: 'dashboard',
        availableEntries: [
          { id: '1', title: 'Medical Record', category: 'Health' }
        ]
      };

      const result = await engine.processText('edit medical record', context);
      
      expect(result.routing.success).toBe(true);
      expect(result.routing.result?.action).toBe('edit_entry');
    });
  });

  describe('Performance', () => {
    it('should process commands within reasonable time', async () => {
      const result = await engine.processText('create new entry with long description');
      
      expect(result.processingTime).toBeLessThan(1000); // Should be under 1 second
    });
  });

  describe('Confidence Thresholds', () => {
    it('should reject low confidence intents', async () => {
      const lowConfidenceEngine = new NLPEngine({
        confidenceThreshold: 0.9,
        enableLogging: false
      });

      const result = await lowConfidenceEngine.processText('maybe create something');
      
      expect(result.routing.success).toBe(false);
      expect(result.intent.confidence).toBeLessThan(0.9);
    });
  });

  describe('Help System', () => {
    it('should provide help information', async () => {
      const result = await engine.processText('help');
      
      expect(result.intent.name).toBe('help');
      expect(result.routing.success).toBe(true);
      expect(result.routing.result?.message).toContain('Available voice commands');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty input', async () => {
      const result = await engine.processText('');
      
      expect(result.intent.name).toBe('unknown');
      expect(result.routing.success).toBe(false);
    });

    it('should handle very long input', async () => {
      const longText = 'create '.repeat(100) + 'entry';
      const result = await engine.processText(longText);
      
      expect(result.intent.name).toBe('create_entry');
    });

    it('should handle special characters', async () => {
      const result = await engine.processText('create entry "Special @#$% Document"');
      
      expect(result.intent.name).toBe('create_entry');
      expect(result.intent.parameters.title).toBe('Special @#$% Document');
    });
  });
});
