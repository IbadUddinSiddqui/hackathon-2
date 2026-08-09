// Edge-runtime Sentry config. Loaded from instrumentation.ts when the Next.js
// runtime is 'edge' (middleware / edge routes).
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  debug: false,
});
