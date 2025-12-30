// app/layout.tsx - UPDATED VERSION (backward compatible)
import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import { Disclaimer } from "@/components/Disclaimer";
import { canonical } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Airline Fees Reference",
    template: "%s | Airline Fees Reference",
  },
  description: "Reference tables of published airline fees, organized by airline and fee category.",
  alternates: {
    canonical: canonical("/"),
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script
          id="adsense"
          async
          strategy="afterInteractive"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2711217631458410"
          crossOrigin="anonymous"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Header */}
          <header className="mb-8 pb-4 border-b border-gray-200">
            <Link
              href="/"
              className="text-2xl font-bold text-gray-900 hover:text-blue-700 no-underline hover:no-underline"
            >
              Airline Fees Reference
            </Link>
            <p className="mt-2 text-gray-600 text-sm max-w-3xl">
              Direct, unbiased reference data for airline baggage, seat selection, and change fees.
              No fluff, just facts.
            </p>
          </header>

          {/* Main Content - UNCHANGED, just wrapped */}
          <main className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {children}
          </main>

          {/* Footer */}
          <footer className="mt-12 pt-6 border-t border-gray-200 text-sm text-gray-600">
            <div className="flex flex-wrap gap-4 mb-4">
              <Link href="/about" className="text-blue-600 hover:text-blue-800 hover:underline">
                About
              </Link>
              <Link href="/methodology" className="text-blue-600 hover:text-blue-800 hover:underline">
                Methodology
              </Link>
              <Link href="/privacy" className="text-blue-600 hover:text-blue-800 hover:underline">
                Privacy
              </Link>
              <Link href="/contact" className="text-blue-600 hover:text-blue-800 hover:underline">
                Contact
              </Link>
            </div>
            
            <Disclaimer />
            
            <div className="mt-4 text-xs text-gray-500">
              Data is verified from airline websites. Last updated regularly.
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}