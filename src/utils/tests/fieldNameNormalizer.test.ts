import { describe, it, expect } from 'vitest';
import { normalizeToDbFieldName, toDisplayFieldName, validateFieldName, isReservedFieldName } from '../fieldNameNormalizer';

describe('fieldNameNormalizer', () => {
  it('normalizes simple names', () => {
    expect(normalizeToDbFieldName('Policy Number')).toBe('policy_number');
    expect(normalizeToDbFieldName('Date of Birth')).toBe('date_of_birth');
  });

  it('handles camelCase and dashes', () => {
    expect(normalizeToDbFieldName('policyNumber')).toBe('policy_number');
    expect(normalizeToDbFieldName('policy-number')).toBe('policy_number');
  });

  it('strips special characters and trims', () => {
    expect(normalizeToDbFieldName('  SSN#  ')).toBe('ssn');
    expect(normalizeToDbFieldName('Account ID (Primary)')).toBe('account_id_primary');
  });

  it('converts db name to display name', () => {
    expect(toDisplayFieldName('policy_number')).toBe('Policy Number');
    expect(toDisplayFieldName('date_of_birth')).toBe('Date Of Birth');
  });

  it('handles reserved field names', () => {
    expect(normalizeToDbFieldName('Title')).toBe('custom_title');
    expect(normalizeToDbFieldName('ID')).toBe('custom_id');
    expect(normalizeToDbFieldName('Created At')).toBe('custom_created_at');
  });

  it('validates field names correctly', () => {
    expect(validateFieldName('Policy Number')).toEqual({ isValid: true });
    expect(validateFieldName('Title')).toEqual({ 
      isValid: false, 
      error: '"Title" is a reserved field name',
      suggestion: 'Custom Title'
    });
    expect(validateFieldName('')).toEqual({ 
      isValid: false, 
      error: 'Field name cannot be empty'
    });
  });

  it('detects reserved field names', () => {
    expect(isReservedFieldName('title')).toBe(true);
    expect(isReservedFieldName('Title')).toBe(true);
    expect(isReservedFieldName('TITLE')).toBe(true);
    expect(isReservedFieldName('Policy Number')).toBe(false);
  });
});
