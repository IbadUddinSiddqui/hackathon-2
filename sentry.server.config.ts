// Server-side (Node) Sentry config. Loaded from instrumentation.ts when the
// Next.js runtime is 'nodejs'.
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1.0,

  debug: false,
});
