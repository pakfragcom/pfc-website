import crypto from 'crypto';

// admin-auth.js reads ADMIN_PASS_HASH once at module-load time, so it must be
// set here (setupFiles runs before any test file's imports are evaluated) —
// setting it inside a test file would run too late, after the static import
// of admin-auth.js has already resolved PASS_HASH from the real env var.
export const TEST_ADMIN_PASSWORD = 'test-password-not-a-real-secret';
process.env.ADMIN_PASS_HASH = crypto
  .createHash('sha256')
  .update(TEST_ADMIN_PASSWORD)
  .digest('hex');
