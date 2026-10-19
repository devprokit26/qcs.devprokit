import { describe, it, expect } from 'vitest';
import { checkAmount, checkDate, checkEmail, checkInteger, checkNonNegative, checkPhone, checkText, firstError } from '@/utils/validation';

describe('form validation helpers', () => {
  it('rejects empty, zero, negative and 3-decimal amounts', () => {
    expect(checkAmount('')).toMatch(/required/);
    expect(checkAmount('0')).toMatch(/greater than 0/);
    expect(checkAmount('-5')).toMatch(/greater than 0/);
    expect(checkAmount('1.234')).toMatch(/2 decimal/);
    expect(checkAmount('abc')).toMatch(/valid number/);
    expect(checkAmount('1500.50')).toBeNull();
  });
  it('rejects future and malformed dates', () => {
    expect(checkDate('')).toMatch(/required/);
    expect(checkDate('2999-01-01')).toMatch(/future/);
    expect(checkDate('2999-01-01', 'Due', { allowFuture: true })).toBeNull();
    expect(checkDate('1990-01-01')).toMatch(/year/);
  });
  it('checks integers, text, email and phone', () => {
    expect(checkInteger('2.5', 'Pieces', { min: 1 })).toMatch(/whole/);
    expect(checkInteger('0', 'Pieces', { min: 1 })).toMatch(/at least 1/);
    expect(checkText('  ', 'Name')).toMatch(/required/);
    expect(checkText('', 'Note', { required: false })).toBeNull();
    expect(checkEmail('bad@')).toMatch(/not valid/);
    expect(checkEmail('a@b.com')).toBeNull();
    expect(checkPhone('03001234567')).toBeNull();
    expect(checkPhone('0300-1234567')).toMatch(/exactly 11 digits/);
    expect(checkNonNegative('-1', 'Terms')).toMatch(/negative/);
  });
  it('firstError returns the first message', () => {
    expect(firstError(null, 'A', 'B')).toBe('A');
    expect(firstError(null, false)).toBeNull();
  });
});
