"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useState } from "react";
import { useLocale } from "@/lib/locale-provider";
import { t } from "@/lib/i18n";
import { useTenant } from "@/lib/tenant-provider";
import { FaWhatsapp } from "react-icons/fa";

const iconBtn =
  "flex h-9 w-9 items-center justify-center border border-brand-ink-inverse/15 text-brand-ink-inverse/70 transition hover:border-brand-ink-inverse hover:text-brand-ink-inverse";

function Footer() {
  const { locale } = useLocale();
  // P4-05 — per-tenant branding: name, tagline, WhatsApp + contact email.
  const { tenant } = useTenant();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Real subscription: persists the email to Sanity via /api/newsletter. The
  // success message only appears when the server confirms the write (or the
  // email was already subscribed) — never for a local-only fake success.
  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!value || submitting) return;
    setSubmitting(true);
    // Start the attempt fresh — never show a stale success from a previous run.
    setSubscribed(false);
    setError(null);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || t(locale, "footer.newsletterError"));
      }
      setSubscribed(true);
      setEmail("");
    } catch (err: any) {
      setError(err?.message || t(locale, "footer.newsletterError"));
    } finally {
      setSubmitting(false);
    }
  };

  const year = new Date().getFullYear();
  const linkCls =
    "text-sm text-brand-ink-inverse/60 transition-colors hover:text-brand-ink-inverse";

  const columns = [
    {
      title: t(locale, "nav.shop"),
      links: [
        { label: t(locale, "nav.shop"), href: "/products" },
        { label: t(locale, "footer.orders"), href: "/dashboard" },
        { label: t(locale, "nav.wishlist"), href: "/wishlist" },
        { label: t(locale, "nav.cart"), href: "/cart" },
      ],
    },
    {
      title: t(locale, "footer.account"),
      links: [
        { label: t(locale, "header.dashboard"), href: "/dashboard" },
        { label: t(locale, "footer.profile"), href: "/profile" },
        { label: t(locale, "footer.settings"), href: "/settings" },
        { label: t(locale, "header.login"), href: "/login" },
      ],
    },
    {
      title: t(locale, "footer.company"),
      links: [
        { label: t(locale, "footer.about"), href: "/about" },
        { label: t(locale, "footer.contact"), href: "/contact" },
      ],
    },
  ];

  return (
    <footer className="mt-16 bg-brand-ink-soft text-brand-ink-inverse">
      {/* Newsletter */}
      <div className="mx-auto max-w-7xl px-4 py-14 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 border border-brand-ink-inverse/10 p-8 md:flex-row">
          <h3 className="max-w-md text-center text-2xl font-bold tracking-tight sm:text-3xl md:text-left">
            {t(locale, "footer.newsletterHead")}
          </h3>
          <form onSubmit={subscribe} className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
            <input
              type="email"
              required
              value={email}
              disabled={submitting}
              onChange={(e) => {
                setEmail(e.target.value);
                setSubscribed(false);
                setError(null);
              }}
              placeholder={t(locale, "footer.emailPlaceholder")}
              className="h-12 flex-1 border border-brand-ink-inverse/15 bg-transparent px-5 text-sm text-brand-ink-inverse placeholder:text-brand-ink-inverse/40 outline-none transition focus:border-brand-ink-inverse disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={submitting}
              className="h-12 shrink-0 bg-brand-ink-inverse px-7 text-sm font-semibold uppercase tracking-[0.12em] text-brand-ink transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? t(locale, "footer.subscribing") : t(locale, "footer.subscribe")}
            </button>
          </form>
        </div>
        {subscribed ? (
          <p className="mt-4 text-center text-sm text-brand-ok">{t(locale, "footer.subscribed")}</p>
        ) : error ? (
          <p className="mt-4 text-center text-sm text-brand-bad" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      {/* Links */}
      <div className="mx-auto max-w-7xl px-4 pb-10 lg:px-8">
        <div className="grid grid-cols-2 gap-8 border-t border-brand-ink-inverse/10 pt-10 md:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2">
            <Image
              src="/logo-full-black.svg"
              width={150}
              height={50}
              alt={tenant.name}
              className="invert"
            />
            <p className="mt-3 max-w-xs text-sm text-brand-ink-inverse/60">
              {tenant.tagline || t(locale, "footer.tagline")}
            </p>
            <div className="mt-4 flex gap-3">
              {tenant.whatsapp && (
                <a
                  href={`https://wa.me/${tenant.whatsapp.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={iconBtn}
                  aria-label="WhatsApp"
                >
                  <FaWhatsapp size={18} />
                </a>
              )}
            </div>
            {tenant.contactEmail && (
              <a
                href={`mailto:${tenant.contactEmail}`}
                className="mt-4 block text-sm text-brand-ink-inverse/60 transition-colors hover:text-brand-ink-inverse"
              >
                {tenant.contactEmail}
              </a>
            )}
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.15em] text-brand-ink-inverse/90">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className={linkCls}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-brand-ink-inverse/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-5 sm:flex-row lg:px-8">
          <p className="text-xs text-brand-ink-inverse/50">
            © {year} {tenant.name}. {t(locale, "footer.rights")}
          </p>
          <div className="flex items-center gap-2">
            <Image width={44} height={28} alt="Visa" src="/visa.svg" className="rounded-sm" />
            <Image width={44} height={28} alt="Mastercard" src="/master.svg" className="rounded-sm" />
            <span className="border border-brand-ink-inverse/15 px-2 py-1 text-[11px] font-semibold text-brand-ink-inverse/70">
              Safepay
            </span>
            <span className="border border-brand-ink-inverse/15 px-2 py-1 text-[11px] font-semibold text-brand-ink-inverse/70">
              COD
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
