import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { ApolloWrapper } from "@/components/providers/apollo-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { initToastScheduler } from "@/lib/services/toast-scheduler";
import { initVaruniScheduler } from "@/lib/services/varuni-scheduler";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Varuni",
  description: "Complete restaurant management solution with inventory, scheduling, invoicing, and robotic fleet management",
  applicationName: 'Varuni',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/tgl.png', type: 'image/png', sizes: '512x512' }
    ],
    apple: [
      { url: '/tgl.png', sizes: '180x180', type: 'image/png' }
    ],
    shortcut: ['/tgl.png']
  },
  themeColor: '#0f172a',
  appleWebApp: {
    capable: true,
    title: 'Varuni',
    statusBarStyle: 'default'
  },
  openGraph: {
    title: 'Varuni',
    description: 'Complete restaurant management solution with inventory, scheduling, invoicing, and robotic fleet management',
    url: 'https://varuni.thegraineledger.com',
    siteName: 'Varuni',
    images: [
      { url: 'https://engram1.blob.core.windows.net/varuni/socialbanner.jpg', width: 1200, height: 630, alt: 'Varuni Backoffice' }
    ],
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Varuni',
    description: 'Complete restaurant management solution with inventory, scheduling, invoicing, and robotic fleet management',
    images: ['https://engram1.blob.core.windows.net/varuni/socialbanner.jpg']
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Initialize background scheduler on server/client render once
  if (typeof window === 'undefined') {
    // Server-side
    initToastScheduler();
    initVaruniScheduler();
  }
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          "antialiased"
        )}
      >
        <div className="app-accent-bg" aria-hidden="true" />
        {/* Removed glass overlay to prevent header blurring */}
        <ThemeProvider>
          <div className="relative z-10">
            <ApolloWrapper>
              {children}
            </ApolloWrapper>
            <Toaster position="top-right" />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}