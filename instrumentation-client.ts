// Client-side Sentry config. Next.js loads this file in the browser bundle
// (replaces the deprecated sentry.client.config.ts — works with both webpack
// and Turbopack builds). Without NEXT_PUBLIC_SENTRY_DSN set, Sentry logs a
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

// Instrument client-side router navigations for Sentry (Sentry 10 recommended
// hook for instrumentation-client).
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
