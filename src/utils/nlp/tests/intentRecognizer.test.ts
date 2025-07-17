
import { describe, it, expect, beforeEach } from 'vitest';
import { IntentRecognizer } from '../intentRecognizer';

describe('IntentRecognizer', () => {
  let recognizer: IntentRecognizer;

  beforeEach(() => {
    recognizer = new IntentRecognizer();
  });

  describe('Basic Intent Recognition', () => {
    it('should recognize create intents', () => {
      const testCases = [
        'create new entry',
        'add new record',
        'make a new document',
        'new entry'
      ];

      testCases.forEach(text => {
        const intent = recognizer.recognizeIntent(text);
        expect(intent.name).toBe('create_entry');
        expect(intent.confidence).toBeGreaterThan(0.5);
      });
    });

    it('should recognize delete intents', () => {
      const testCases = [
        'delete medical record',
        'remove old invoice',
        'erase document',
        'trash file'
      ];

      testCases.forEach(text => {
        const intent = recognizer.recognizeIntent(text);
        expect(intent.name).toBe('delete_entry');
        expect(intent.confidence).toBeGreaterThan(0.5);
      });
    });

    it('should recognize search intents', () => {
      const testCases = [
        'search for documents',
        'find medical records',
        'look for invoice',
        'show me files'
      ];

      testCases.forEach(text => {
        const intent = recognizer.recognizeIntent(text);
        expect(intent.name).toBe('search_entries');
        expect(intent.confidence).toBeGreaterThan(0.5);
      });
    });
  });

  describe('Parameter Extraction', () => {
    it('should extract title from create commands', () => {
      const intent = recognizer.recognizeIntent('create entry called "Medical Report"');
      expect(intent.parameters.title).toBe('Medical Report');
    });

    it('should extract category from context', () => {
      const intent = recognizer.recognizeIntent('create new health document');
      expect(intent.parameters.category).toBe('Health');
    });

    it('should extract search targets', () => {
      const intent = recognizer.recognizeIntent('search for tax documents');
      expect(intent.parameters.query).toBe('tax documents');
    });

    it('should extract delete targets', () => {
      const intent = recognizer.recognizeIntent('delete old medical records');
      expect(intent.parameters.target).toBe('old medical records');
    });
  });

  describe('Confidence Scoring', () => {
    it('should give higher confidence for exact matches', () => {
      const exact = recognizer.recognizeIntent('create new entry');
      const partial = recognizer.recognizeIntent('maybe create something like an entry');
      
      expect(exact.confidence).toBeGreaterThan(partial.confidence);
    });

    it('should boost confidence when parameters are found', () => {
      const withParams = recognizer.recognizeIntent('create entry called "Test Document"');
      const withoutParams = recognizer.recognizeIntent('create entry');
      
      expect(withParams.confidence).toBeGreaterThan(withoutParams.confidence);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty input', () => {
      const intent = recognizer.recognizeIntent('');
      expect(intent.name).toBe('unknown');
      expect(intent.confidence).toBe(0);
    });

    it('should handle unknown commands', () => {
      const intent = recognizer.recognizeIntent('do something completely random');
      expect(intent.name).toBe('unknown');
      expect(intent.confidence).toBe(0);
    });

    it('should handle mixed case input', () => {
      const intent = recognizer.recognizeIntent('CREATE NEW ENTRY');
      expect(intent.name).toBe('create_entry');
    });
  });

  describe('Available Intents', () => {
    it('should return list of available intents', () => {
      const intents = recognizer.getAvailableIntents();
      expect(intents).toContain('create_entry');
      expect(intents).toContain('delete_entry');
      expect(intents).toContain('search_entries');
    });

    it('should return examples for intents', () => {
      const examples = recognizer.getExamplesForIntent('create_entry');
      expect(examples.length).toBeGreaterThan(0);
      expect(examples[0]).toContain('create');
    });
  });
});
