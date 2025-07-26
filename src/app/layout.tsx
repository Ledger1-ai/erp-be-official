import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ApolloClientProvider } from "@/components/providers/apollo-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Varuni Backoffice - The Graine Ledger",
  description: "AI-powered restaurant management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        <ApolloClientProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </ApolloClientProvider>
      </body>
    </html>
  );
}
