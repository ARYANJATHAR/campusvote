import type { Metadata, Viewport } from "next";
import { Poppins, Roboto_Mono } from "next/font/google";
import "./globals.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import dynamic from 'next/dynamic';
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"

// Dynamically import Toaster with client-side only rendering
const ToasterProvider = dynamic(
  () => import('../components/providers/ToasterProvider').then((mod) => mod.ToasterProvider),
  { ssr: false }
);

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#ffffff',
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  title: "Campus Vote",
  description: "A college student voting platform",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Campus Vote",
    description: "A college student voting platform",
    type: "website",
    locale: "en_US",
    siteName: "Campus Vote",
  },
  twitter: {
    card: "summary_large_image",
    title: "Campus Vote",
    description: "A college student voting platform",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://lgojtvkphvgcqspeaick.supabase.co" />
        
        <link rel="preload" href="/manifest.json" as="application/manifest+json" type="application/manifest+json" />
        <link rel="preload" href="/favicon.ico" as="image" type="image/x-icon" />
        <link rel="preload" href="/apple-touch-icon.png" as="image" type="image/png" />
        <link rel="preload" href="/icon-192x192.png" as="image" type="image/png" />
        <link rel="preload" href="/icon-512x512.png" as="image" type="image/png" />
        
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="dns-prefetch" href="https://lgojtvkphvgcqspeaick.supabase.co" />
      </head>
      <body className={`${poppins.variable} ${robotoMono.variable} font-sans antialiased`}>
        {children}
        <ToasterProvider />
        <Analytics />
      </body>
    </html>
  );
}
