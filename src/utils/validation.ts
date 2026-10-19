/**
 * Small shared validators used by every form.
 * Each returns an error message (string) or null when the value is valid,
 * so forms can do:  const err = a() || b() || c();  if (err) toast.error(err);
 */
import { todayLocal } from './dates';

const MAX_AMOUNT = 1_000_000_000; // PKR 100 crore — anything above is almost certainly a typo

/** Required amount that must be > 0. */
export function checkAmount(raw: string | number, label = 'Amount'): string | null {
  const s = String(raw ?? '').trim();
  if (s === '') return `${label} is required`;
  const n = Number(s);
  if (!Number.isFinite(n)) return `${label} must be a valid number`;
  if (n <= 0) return `${label} must be greater than 0`;
  if (n > MAX_AMOUNT) return `${label} is too large — please check the figure`;
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return `${label} can have at most 2 decimal places`;
  return null;
}

/** Optional amount: empty is fine, otherwise must be >= 0. */
export function checkOptionalAmount(raw: string | number, label = 'Amount'): string | null {
  const s = String(raw ?? '').trim();
  if (s === '') return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return `${label} must be a valid number`;
  if (n < 0) return `${label} cannot be negative`;
  if (n > MAX_AMOUNT) return `${label} is too large — please check the figure`;
  return null;
}

/** Optional / required non-negative number (weights, limits …). */
export function checkNonNegative(raw: string | number, label: string, required = false): string | null {
  const s = String(raw ?? '').trim();
  if (s === '') return required ? `${label} is required` : null;
  const n = Number(s);
  if (!Number.isFinite(n)) return `${label} must be a valid number`;
  if (n < 0) return `${label} cannot be negative`;
  return null;
}

/** Whole number within a range. */
export function checkInteger(
  raw: string | number,
  label: string,
  { min = 0, max = Number.MAX_SAFE_INTEGER, required = false } = {}
): string | null {
  const s = String(raw ?? '').trim();
  if (s === '') return required ? `${label} is required` : null;
  const n = Number(s);
  if (!Number.isInteger(n)) return `${label} must be a whole number`;
  if (n < min) return `${label} must be at least ${min}`;
  if (n > max) return `${label} cannot be more than ${max}`;
  return null;
}

/** Required YYYY-MM-DD date, optionally not in the future. */
export function checkDate(raw: string, label = 'Date', { allowFuture = false } = {}): string | null {
  if (!raw) return `${label} is required`;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw) || Number.isNaN(new Date(raw).getTime())) {
    return `${label} is not a valid date`;
  }
  if (raw < '2000-01-01') return `${label} looks wrong — please check the year`;
  if (!allowFuture && raw > todayLocal()) return `${label} cannot be in the future`;
  return null;
}

/** Required text with a sensible length. */
export function checkText(raw: string, label: string, { min = 1, max = 120, required = true } = {}): string | null {
  const s = (raw ?? '').trim();
  if (!s) return required ? `${label} is required` : null;
  if (s.length < min) return `${label} must be at least ${min} characters`;
  if (s.length > max) return `${label} is too long (max ${max} characters)`;
  return null;
}

/** Optional email. */
export function checkEmail(raw: string): string | null {
  const s = (raw ?? '').trim();
  if (!s) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s) ? null : 'Email address is not valid';
}

/** Optional Pakistani mobile number: exactly 11 digits when provided. */
export function checkPhone(raw: string): string | null {
  const s = (raw ?? '').trim();
  if (!s) return null;
  if (!/^\d{11}$/.test(s)) return 'Phone number must be exactly 11 digits';
  return null;
}

/** Returns the first error from a list of checks (or null). */
export function firstError(...errors: Array<string | null | undefined | false>): string | null {
  return (errors.find(Boolean) as string | undefined) ?? null;
}
