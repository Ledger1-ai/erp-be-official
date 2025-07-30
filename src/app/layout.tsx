import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { ApolloWrapper } from "@/components/providers/apollo-provider";

export const metadata: Metadata = {
  title: "Varuni Backoffice - Restaurant Management System",
  description: "Complete restaurant management solution with inventory, scheduling, invoicing, and robotic fleet management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ApolloWrapper>
          {children}
        </ApolloWrapper>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#4ade80',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  );
}