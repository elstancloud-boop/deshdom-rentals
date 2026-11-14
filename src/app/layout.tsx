import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display", axes: ["wdth"] });
const body = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-body" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: { default: "Deshdom Rentals. Rent by the day", template: "%s · Deshdom Rentals" },
  description: "Rent cameras, audio, outdoor, event and workshop gear by the day in Wigan and Greater Manchester. Instant availability, free cancellation, deposits refunded on return.",
  openGraph: { title: "Deshdom Rentals. Rent by the day", type: "website" },
};
export const viewport: Viewport = { themeColor: "#eceee9", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await headers(); // opt into dynamic rendering so the CSP nonce is applied per request
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="min-h-screen">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:p-3">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
