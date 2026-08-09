// Client-side Sentry config. withSentryConfig injects this into the browser
// bundle automatically. Without NEXT_PUBLIC_SENTRY_DSN set, Sentry logs a
// warning and no-ops — builds and dev never break.
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: 1.0,

  // Disable Session Replay unless explicitly enabled with an org subscription.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  debug: false,
});
