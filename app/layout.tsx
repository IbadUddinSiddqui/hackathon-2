import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Provider } from "@/components/ui/provider"
import { SessionProvider } from "next-auth/react";
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from "@/lib/site";

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
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {/* ChakraProvider wrapped around the body with custom theme */}
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <Provider>
          <SessionProvider>
        
          {children}
      </SessionProvider>
      </Provider>
        </body>
    </html>
  );
}
