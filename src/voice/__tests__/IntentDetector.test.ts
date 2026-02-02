/**
 * Intent Detector Tests
 * Tests the intent detection and classification system
 */

import { describe, it, expect } from 'vitest';
import { IntentDetector } from '../core/IntentDetector';

describe('IntentDetector', () => {
  const detector = new IntentDetector();

  describe('detectIntent', () => {
    describe('Confirmation Intents', () => {
      it('should detect positive confirmation', () => {
        const cases = ['yes', 'yeah', 'ok', 'sure', 'confirm', 'go ahead'];

        cases.forEach(text => {
          const result = detector.detectIntent(text);
          expect(result.intent).toBe('confirm');
          expect(result.confidence).toBeGreaterThan(0.9);
        });
      });

      it('should detect negative confirmation', () => {
        const cases = ['no', 'nope', 'cancel', 'stop', 'abort'];

        cases.forEach(text => {
          const result = detector.detectIntent(text);
          expect(result.intent).toBe('deny');
          expect(result.confidence).toBeGreaterThan(0.9);
        });
      });
    });

    describe('Create Intents', () => {
      it('should detect create entry commands', () => {
        const cases = [
          'create a new entry',
          'add new entry',
          'make a new record',
          'create entry',
        ];

        cases.forEach(text => {
          const result = detector.detectIntent(text);
          expect(result.intent).toBe('create');
        });
      });

      it('should not detect create without entry keyword', () => {
        const result = detector.detectIntent('create something');
        expect(result.intent).not.toBe('create');
      });
    });

    describe('Delete Intents', () => {
      it('should detect delete commands', () => {
        const cases = [
          'delete this entry',
          'remove shopping list',
          'erase the record',
          'trash it',
        ];

        cases.forEach(text => {
          const result = detector.detectIntent(text);
          expect(result.intent).toBe('delete');
        });
      });
    });

    describe('Edit/Open Intents', () => {
      it('should detect open commands', () => {
        const cases = ['open shopping list', 'edit medical records', 'show my notes'];

        cases.forEach(text => {
          const result = detector.detectIntent(text);
          expect(result.intent).toBe('edit');
        });
      });

      it('should detect show all commands', () => {
        const cases = ['show all entries', 'list all documents', 'display everything'];

        cases.forEach(text => {
          const result = detector.detectIntent(text);
          expect(result.intent).toBe('edit');
          expect(result.commandType).toBe('show_all');
        });
      });
    });

    describe('Search Intents', () => {
      it('should detect search commands', () => {
        const cases = ['search for budget', 'find medical', 'look for contacts'];

        cases.forEach(text => {
          const result = detector.detectIntent(text);
          expect(result.intent).toBe('search');
        });
      });
    });

    describe('Cancel Intents', () => {
      it('should detect cancel commands', () => {
        const cases = ['cancel', 'close', 'exit', 'dismiss', 'go back'];

        cases.forEach(text => {
          const result = detector.detectIntent(text);
          expect(result.intent).toBe('cancel');
        });
      });
    });
  });

  describe('matchCategory', () => {
    it('should match direct category names', () => {
      expect(detector.matchCategory('Documents')).toBe('Documents');
      expect(detector.matchCategory('health')).toBe('Health');
      expect(detector.matchCategory('CONTACTS')).toBe('Contacts');
      expect(detector.matchCategory('Finance')).toBe('Finance');
      expect(detector.matchCategory('personal')).toBe('Personal');
    });

    it('should match category aliases', () => {
      expect(detector.matchCategory('docs')).toBe('Documents');
      expect(detector.matchCategory('medical')).toBe('Health');
      expect(detector.matchCategory('money')).toBe('Finance');
      expect(detector.matchCategory('friends')).toBe('Contacts');
      expect(detector.matchCategory('notes')).toBe('Personal');
    });

    it('should return null for unknown categories', () => {
      expect(detector.matchCategory('random')).toBeNull();
      expect(detector.matchCategory('xyz')).toBeNull();
    });
  });

  describe('findMatchingEntry', () => {
    const entries = [
      { id: '1', title: 'Shopping List', category: 'Personal' },
      { id: '2', title: 'Medical Records', category: 'Health' },
      { id: '3', title: 'Budget 2024', category: 'Finance' },
    ];

    it('should find exact matches', () => {
      const result = detector.findMatchingEntry('shopping list', entries);
      expect(result).not.toBeNull();
      expect(result?.id).toBe('1');
    });

    it('should find partial matches', () => {
      const result = detector.findMatchingEntry('medical', entries);
      expect(result).not.toBeNull();
      expect(result?.id).toBe('2');
    });

    it('should return null for no match', () => {
      const result = detector.findMatchingEntry('nonexistent', entries);
      expect(result).toBeNull();
    });
  });

  describe('detectNavigationDestination', () => {
    it('should detect dashboard navigation', () => {
      expect(detector.detectNavigationDestination('go to dashboard')).toBe('dashboard');
      expect(detector.detectNavigationDestination('open dashboard')).toBe('dashboard');
    });

    it('should detect brain dump navigation', () => {
      expect(detector.detectNavigationDestination('open brain dump')).toBe('brain-dump');
      expect(detector.detectNavigationDestination('go to braindump')).toBe('brain-dump');
    });

    it('should detect settings navigation', () => {
      expect(detector.detectNavigationDestination('open settings')).toBe('settings');
      expect(detector.detectNavigationDestination('go to preferences')).toBe('settings');
    });

    it('should return null for unknown destinations', () => {
      expect(detector.detectNavigationDestination('go somewhere')).toBeNull();
    });
  });

  describe('isLikelyNewCommand', () => {
    it('should identify new commands', () => {
      expect(detector.isLikelyNewCommand('create a new entry')).toBe(true);
      expect(detector.isLikelyNewCommand('open shopping list')).toBe(true);
      expect(detector.isLikelyNewCommand('delete this')).toBe(true);
    });

    it('should identify non-commands', () => {
      expect(detector.isLikelyNewCommand('yes')).toBe(false);
      expect(detector.isLikelyNewCommand('no')).toBe(false);
      expect(detector.isLikelyNewCommand('ok')).toBe(false);
    });
  });
});
