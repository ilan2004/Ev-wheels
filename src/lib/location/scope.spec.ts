import { describe, expect, it, vi } from 'vitest';
import { scopeQuery, withLocationId } from './scope';

// Mock localStorage used indirectly by getActiveLocationId when scopeQuery is used via code paths that call it.
// Here we pass a fake builder and set active location id via storage semantics.

global.localStorage = {
  store: new Map<string, string>(),
  getItem(key: string) {
    return (this.store as any).get(key) ?? null;
  },
  setItem(key: string, value: string) {
    (this.store as any).set(key, value);
  },
  removeItem(key: string) {
    (this.store as any).delete(key);
  },
  clear() {
    (this.store as any).clear();
  }
} as any;

const ACTIVE_LOCATION_ID_KEY = 'activeLocationId';

describe('location scoping helpers', () => {
  it('withLocationId adds location_id for scoped tables when active location set', () => {
    localStorage.setItem(ACTIVE_LOCATION_ID_KEY, 'loc-1');
    const input = { name: 'Acme' } as any;
    const out = withLocationId('customers', input);
    expect(out.location_id).toBe('loc-1');
  });

  it('withLocationId does not add location_id for non-scoped tables', () => {
    localStorage.setItem(ACTIVE_LOCATION_ID_KEY, 'loc-1');
    const input = { foo: 'bar' } as any;
    const out = withLocationId('inventory', input);
    expect(out.location_id).toBeUndefined();
  });

  it('scopeQuery applies eq filter when active location set', () => {
    localStorage.setItem(ACTIVE_LOCATION_ID_KEY, 'loc-2');
    const calls: any[] = [];
    const builder = {
      eq: (col: string, val: any) => {
        calls.push([col, val]);
        return builder;
      }
    } as any;
    const out = scopeQuery('customers', builder);
    expect(out).toBe(builder);
    expect(calls).toEqual([['location_id', 'loc-2']]);
  });

  it('scopeQuery does not apply filter when no active location', () => {
    localStorage.removeItem(ACTIVE_LOCATION_ID_KEY);
    const calls: any[] = [];
    const builder = {
      eq: (col: string, val: any) => {
        calls.push([col, val]);
        return builder;
      }
    } as any;
    scopeQuery('customers', builder);
    expect(calls.length).toBe(0);
  });
});
