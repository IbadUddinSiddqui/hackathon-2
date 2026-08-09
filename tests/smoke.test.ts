import { describe, it, expect } from 'vitest';
import { DELIVERY_FEE } from '@/lib/constants';

// Smoke test: proves the test runner works and the "@" alias resolves to the
// project root (which the unit tests for discounts/orders rely on).
describe('smoke', () => {
  it('resolves the @ alias and imports a shared constant', () => {
    expect(DELIVERY_FEE).toBe(200);
  });

  it('runs the test runner', () => {
    expect(1 + 1).toBe(2);
  });
});
