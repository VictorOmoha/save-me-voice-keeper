
import { describe, it, expect, beforeEach } from 'vitest';
import { ParameterValidator } from '../parameterValidator';

describe('ParameterValidator', () => {
  let validator: ParameterValidator;

  beforeEach(() => {
    validator = new ParameterValidator();
  });

  describe('Create Entry Validation', () => {
    it('should validate valid create entry parameters', () => {
      const params = {
        title: 'Medical Report',
        category: 'Health',
        description: 'Annual checkup results'
      };

      const result = validator.validate('create_entry', params);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid category', () => {
      const params = {
        title: 'Test',
        category: 'InvalidCategory'
      };

      const result = validator.validate('create_entry', params);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('must be one of');
    });

    it('should reject title that is too long', () => {
      const params = {
        title: 'A'.repeat(150) // Too long
      };

      const result = validator.validate('create_entry', params);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('must be no more than');
    });
  });

  describe('Delete Entry Validation', () => {
    it('should require target parameter', () => {
      const result = validator.validate('delete_entry', {});
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Required parameter \'target\' is missing');
    });

    it('should validate with target', () => {
      const result = validator.validate('delete_entry', { target: 'medical record' });
      expect(result.isValid).toBe(true);
    });
  });

  describe('Search Validation', () => {
    it('should require query parameter', () => {
      const result = validator.validate('search_entries', {});
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Required parameter \'query\' is missing');
    });

    it('should validate date range format', () => {
      const params = {
        query: 'test',
        dateRange: 'invalid-date-range'
      };

      const result = validator.validate('search_entries', params);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('format is invalid');
    });

    it('should accept valid date range', () => {
      const params = {
        query: 'test',
        dateRange: '2023-01-01 to 2023-12-31'
      };

      const result = validator.validate('search_entries', params);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Export Validation', () => {
    it('should require format parameter', () => {
      const result = validator.validate('export_data', {});
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Required parameter \'format\' is missing');
    });

    it('should validate format values', () => {
      const result = validator.validate('export_data', { format: 'INVALID' });
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('must be one of');
    });

    it('should accept valid formats', () => {
      const validFormats = ['PDF', 'CSV', 'EXCEL', 'JSON', 'XML'];
      
      validFormats.forEach(format => {
        const result = validator.validate('export_data', { format });
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('Type Validation', () => {
    it('should validate string types', () => {
      const result = validator.validate('create_entry', { title: 123 });
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('must be of type string');
    });

    it('should trim string values', () => {
      const result = validator.validate('create_entry', { title: '  Test Title  ' });
      expect(result.isValid).toBe(true);
      expect(result.validatedParameters.title).toBe('Test Title');
    });
  });

  describe('Custom Schemas', () => {
    it('should allow adding custom schemas', () => {
      validator.addCustomSchema('custom_intent', {
        customParam: {
          required: true,
          type: 'string',
          minLength: 5
        }
      });

      const result = validator.validate('custom_intent', { customParam: 'test' });
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('must be at least 5 characters');
    });
  });

  describe('Edge Cases', () => {
    it('should handle unknown intent', () => {
      const result = validator.validate('unknown_intent', {});
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('No validation schema found');
    });

    it('should handle null and undefined values', () => {
      const result = validator.validate('create_entry', { 
        title: null,
        category: undefined,
        description: ''
      });
      expect(result.isValid).toBe(true); // All optional parameters
    });
  });
});
