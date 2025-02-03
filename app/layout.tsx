import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Provider } from "@/components/ui/provider"
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";

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
  title: "Ibad's Ecommerce",
  description: "Ecommerce website built with Next.js and Chakra UI",
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
        <Header/>
          {children}
          <Footer/>
      </Provider>
        </body>
    </html>
  );
}
