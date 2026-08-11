import type { Metadata } from "next";
import localFont from "next/font/local";
import { cookies } from "next/headers";
import "./globals.css";
import { Provider } from "@/components/ui/provider"
import { SessionProvider } from "next-auth/react";
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from "@/lib/site";
import { localeFromCookie, localeDir, LOCALE_COOKIE } from "@/lib/i18n";
import { LocaleProvider } from "@/lib/locale-provider";

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



// Metadata for the page
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Pakistani Fashion & Clothing Brand`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "AnK's",
    "Pakistani clothing brand",
    "fashion Pakistan",
    "kurtas",
    "t-shirts",
    "streetwear",
    "online shopping Pakistan",
  ],
  authors: [{ name: SITE_NAME }],
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Pakistani Fashion & Clothing Brand`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: "en_PK",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Pakistani Fashion & Clothing Brand`,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

// RootLayout Component
// P3-20/P3-22 — reads the locale cookie so <html lang/dir> and the client
// provider stay in sync with the language switcher.
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = localeFromCookie(cookieStore.get(LOCALE_COOKIE)?.value);

  return (
    <html lang={locale} dir={localeDir(locale)}>
      {/* P3-22 — Urdu Nastaliq font (only used when html[lang="ur"]) */}
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {locale === "ur" && (
          <link
            href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap"
            rel="stylesheet"
          />
        )}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      {/* ChakraProvider wrapped around the body with custom theme */}
        <Provider>
          <SessionProvider>
            <LocaleProvider locale={locale}>
              {children}
            </LocaleProvider>
          </SessionProvider>
        </Provider>
      </body>
    </html>
  );
}
