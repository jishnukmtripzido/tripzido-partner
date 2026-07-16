import type { Metadata, Viewport } from "next";
import { Inter, Nunito } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { DesktopGate } from "@/components/layout/DesktopGate";

// Root layout has no hooks/state of its own — it only wires up fonts
// and global providers, so it stays a (build-time only) server
// component. Everything below it that touches state, refs, or
// browser APIs is explicitly "use client". With `output: "export"`
// this whole tree is flattened to static HTML/JS at build time
// anyway — there's no Node server involved when Capacitor runs it.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Tripzido Partner",
  description: "Manage your fleet, bookings, and earnings on Tripzido.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${nunito.variable} font-sans`}>
        <AuthProvider>
          <DesktopGate>{children}</DesktopGate>
        </AuthProvider>
      </body>
    </html>
  );
}
