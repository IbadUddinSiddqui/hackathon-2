// Next.js App Router instrumentation: runs once at server startup per runtime.
// The client config is injected into the browser bundle by withSentryConfig.
import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

// Report errors from nested React Server Components / route handlers to Sentry
// (Sentry 10 recommended hook — silences the "outdated configuration" warning).
export const onRequestError = Sentry.captureRequestError;
