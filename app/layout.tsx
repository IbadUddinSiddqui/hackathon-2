import type { Metadata } from "next";
import localFont from "next/font/local";
import { cookies } from "next/headers";
import "./globals.css";
import { Provider } from "@/components/ui/provider"
import { SessionProvider } from "next-auth/react";
import { MotionConfig } from "framer-motion";
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from "@/lib/site";
import { localeFromCookie, localeDir, LOCALE_COOKIE } from "@/lib/i18n";
import { LocaleProvider } from "@/lib/locale-provider";
import { getActiveTenant, ensureDefaultTenant } from "@/lib/tenants";
import { TenantProvider, type TenantBranding } from "@/lib/tenant-provider";
import ChatWidget from "@/app/components/ChatWidget/ChatWidget";

// Load custom fonts
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

// P4-05 — per-tenant metadata (name + tagline) so each storefront is branded.
export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getActiveTenant();
  const name = tenant.name || SITE_NAME;
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `${name} — Pakistani Fashion & Clothing Brand`,
      template: `%s | ${name}`,
    },
    description: tenant.branding?.tagline || SITE_DESCRIPTION,
    keywords: [
      name,
      "Pakistani clothing brand",
      "fashion Pakistan",
      "kurtas",
      "t-shirts",
      "streetwear",
      "online shopping Pakistan",
    ],
    authors: [{ name }],
    openGraph: {
      type: "website",
      siteName: name,
      title: `${name} — Pakistani Fashion & Clothing Brand`,
      description: tenant.branding?.tagline || SITE_DESCRIPTION,
      url: SITE_URL,
      locale: "en_PK",
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

// RootLayout Component
// P3-20/P3-22 — reads the locale cookie so <html lang/dir> and the client
// provider stay in sync with the language switcher.
// P4-04/P4-05 — resolves the active tenant (Host header) and seeds the client.
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = localeFromCookie(cookieStore.get(LOCALE_COOKIE)?.value);

  // P4-01 — make sure the default tenant exists (idempotent; awaited so a
  // fresh serverless instance can't be torn down before the write completes).
  await ensureDefaultTenant();

  const tenant = await getActiveTenant();
  const tenantBranding: TenantBranding = {
    _id: tenant._id,
    name: tenant.name,
    tagline: tenant.branding?.tagline,
    contactEmail: tenant.branding?.contactEmail,
    whatsapp: tenant.branding?.whatsapp,
    accentColor: tenant.branding?.accentColor,
  };

  return (
    <html lang={locale} dir={localeDir(locale)} data-tenant-id={tenant._id}>
      {/* P3-22 — Urdu Nastaliq font (only used when html[lang="ur"]) */}
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* P03 — editorial display face (Fraunces). Reserved for hero/campaign
            moments only via the .text-display type role; Urdu (Nastaliq)
            overrides it when lang="ur" (see globals.css). */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500&display=swap"
          rel="stylesheet"
        />
        {locale === "ur" && (
          /* eslint-disable-next-line @next/next/no-page-custom-font */
          <link
            href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap"
            rel="stylesheet"
          />
        )}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* P19 — one site-wide reduced-motion switch: framer-motion reads the
            OS preference and disables transform/opacity animation for users
            who ask for it (the CSS kill-switch for pure-CSS animations lives
            in globals.css). No per-component useReducedMotion plumbing. */}
        <MotionConfig reducedMotion="user">
          <Provider>
            <SessionProvider>
              <LocaleProvider locale={locale}>
                <TenantProvider tenant={tenantBranding}>
                  {children}
                  {/* P4-15 — storefront FAQ chat (tenant-branded WhatsApp/email). */}
                  <ChatWidget />
                </TenantProvider>
              </LocaleProvider>
            </SessionProvider>
          </Provider>
        </MotionConfig>
      </body>
    </html>
  );
}
