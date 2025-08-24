import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { ApolloWrapper } from "@/components/providers/apollo-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { initToastScheduler } from "@/lib/services/toast-scheduler";

export const metadata: Metadata = {
  title: "Varuni Backoffice - Restaurant Management System",
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
    <html lang="en" suppressHydrationWarning={true}>
      <body className="antialiased">
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