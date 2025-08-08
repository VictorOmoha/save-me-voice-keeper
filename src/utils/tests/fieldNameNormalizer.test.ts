import { describe, it, expect } from 'vitest';
import { normalizeToDbFieldName, toDisplayFieldName } from '../fieldNameNormalizer';

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
});
