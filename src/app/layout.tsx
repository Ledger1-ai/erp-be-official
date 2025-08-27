import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { ApolloWrapper } from "@/components/providers/apollo-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { initToastScheduler } from "@/lib/services/toast-scheduler";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Varuni",
  description: "Complete restaurant management solution with inventory, scheduling, invoicing, and robotic fleet management",
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
  }
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css" />
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          "antialiased"
        )}
      >
        <ThemeProvider>
          <ApolloWrapper>
            {children}
          </ApolloWrapper>
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}