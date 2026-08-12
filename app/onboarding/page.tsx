import type { Metadata } from "next";

// app/onboarding/page.tsx
// P4-04 — shown when a custom domain doesn't resolve to a tenant yet (or the
// tenant is paused). Platform-owner help text; shoppers can keep browsing the
// default store.

export const metadata: Metadata = {
  title: "Storefront Not Configured",
  robots: { index: false, follow: false },
};

export default function OnboardingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-surface px-4 text-brand-ink dark:bg-brand-ink dark:text-brand-ink-inverse">
      <div className="w-full max-w-lg border border-brand-line bg-brand-surface p-10 text-center dark:bg-brand-surface-alt">
        <div className="mx-auto flex h-14 w-14 items-center justify-center bg-brand-ink text-2xl text-brand-ink-inverse dark:bg-brand-ink-inverse dark:text-brand-ink">
          !
        </div>
        <h1 className="mt-5 text-2xl font-bold tracking-tight">
          This storefront isn&apos;t live yet
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-brand-muted">
          The domain you visited isn&apos;t connected to a store on this platform
          yet. If you&apos;re the store owner, add this domain to your tenant in the
          admin panel and it will go live here.
        </p>
        <p className="mt-4 text-sm text-brand-muted/70">
          Platform owners: Admin panel → Platform → Tenants → edit the tenant
          and add this domain to its Domains list (then point the DNS A/CNAME
          record at this server).
        </p>
      </div>
    </main>
  );
}
