import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    domains: ["cdn.sanity.io"],
  },
  /* config options here */
};

// Sentry is fully wired (source maps upload + release management) only when an
// auth token is present (Vercel/CI with SENTRY_* env vars). Locally and in
// builds without secrets it degrades to a warning instead of failing the build.
const sentryConfigured = Boolean(
  process.env.SENTRY_AUTH_TOKEN &&
    (process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN)
);

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  sentryUrl: process.env.SENTRY_URL || "https://sentry.io",

  // No token → don't try to upload source maps or create releases.
  sourcemaps: { disable: !sentryConfigured },
  release: { create: sentryConfigured },

  // Never break a build over missing Sentry credentials.
  errorHandler: (err) => {
    console.warn("[Sentry] build plugin warning (continuing):", err.message);
  },

  silent: !sentryConfigured,
  telemetry: false,
});
