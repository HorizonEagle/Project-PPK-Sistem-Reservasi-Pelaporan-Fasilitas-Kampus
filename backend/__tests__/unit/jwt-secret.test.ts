import { describe, it, expect, afterEach, vi } from 'vitest';
import { getJwtSecret } from '../../lib/jwt-secret';

const decode = (bytes: Uint8Array) => new TextDecoder().decode(bytes);

describe('getJwtSecret', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses JWT_SECRET from the environment', () => {
    vi.stubEnv('JWT_SECRET', 'from-env');
    expect(decode(getJwtSecret())).toBe('from-env');
  });

  it('falls back to a development secret outside production', () => {
    vi.stubEnv('JWT_SECRET', '');
    vi.stubEnv('NODE_ENV', 'development');
    expect(decode(getJwtSecret())).toBeTruthy();
  });

  it('refuses to run in production without JWT_SECRET', () => {
    vi.stubEnv('JWT_SECRET', '');
    vi.stubEnv('NODE_ENV', 'production');
    expect(() => getJwtSecret()).toThrow(/JWT_SECRET/);
  });

  it('accepts an explicit JWT_SECRET in production', () => {
    vi.stubEnv('JWT_SECRET', 'prod-secret');
    vi.stubEnv('NODE_ENV', 'production');
    expect(decode(getJwtSecret())).toBe('prod-secret');
  });
});
