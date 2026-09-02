// app/layout.tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import Script from "next/script";
import { Disclaimer } from "@/components/Disclaimer";
import { canonical } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Airline Fees Expert | Save Money on Every Flight",
    template: "%s | Airline Fees Expert",
  },
  description:
    "Airline fee rules, baggage policies, fare restrictions, and card-benefit references in one place.",
  alternates: {
    canonical: canonical("/"),
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
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
        <Script
          id="google-analytics"
          async
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-NCLQKM5CVL"
        />
        <Script id="google-analytics-config" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-NCLQKM5CVL');
          `}
        </Script>
      </head>

      <body className="bg-slate-50 text-slate-900 antialiased">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Navigation */}
          <nav className="sticky top-0 z-50 flex flex-col items-start justify-between gap-4 rounded-b-xl border-b border-slate-200 bg-white/90 px-4 py-5 shadow-sm backdrop-blur-md sm:flex-row sm:items-center">
            <Link href="/" className="group flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 rounded-lg group-hover:bg-blue-700 transition-colors">
                <span className="text-white font-bold text-xl leading-none" aria-hidden="true">✈</span>
              </div>
              <span className="text-xl font-black tracking-tight text-slate-900">
                AIRLINE<span className="text-blue-600">FEES</span>
              </span>
            </Link>

            <div className="flex w-full gap-5 overflow-x-auto pb-1 text-sm font-semibold text-slate-600 sm:w-auto sm:pb-0 md:gap-6">
              <Link href="/airlines" className="hover:text-blue-600">
                Airlines
              </Link>
              <Link href="/fees" className="hover:text-blue-600">
                Fees &amp; Baggage
              </Link>
              <Link href="/tools/checked-baggage-calculator" className="hover:text-blue-600">
                Calculators
              </Link>
              <Link href="/passenger-rights/eu261" className="hover:text-blue-600">
                Passenger Rights
              </Link>
            </div>
          </nav>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 py-6">
            {/* Main Expert Content Area */}
            <main className="lg:col-span-8">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-10">
                {children}
              </div>
            </main>

            {/* Related planning tools */}
            <aside className="lg:col-span-4 space-y-6">
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
                <h3 className="mb-2 text-xl font-bold text-slate-950">Could a card benefit offset your bag fees?</h3>
                <p className="mb-6 text-sm leading-relaxed text-slate-700">
                  Compare recurring checked-bag savings with the card&apos;s annual fee. Points and unrelated perks are excluded.
                </p>
                <Link
                  href="/best-cards"
                  className="block w-full rounded-xl border border-blue-300 bg-white py-3 text-center font-bold text-blue-800 transition-colors hover:border-blue-500"
                >
                  Check bag-fee math
                </Link>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
                <h4 className="font-bold text-slate-900 mb-4">Useful Fee References</h4>
                <ul className="divide-y divide-slate-100 text-sm text-slate-600">
                  <li className="py-3 first:pt-0">
                    <Link href="/sizer-rules" className="hover:text-blue-600 underline">
                      Sizer enforcement guide
                    </Link>
                  </li>
                  <li className="py-3">
                    <Link href="/tools/checked-baggage-calculator" className="hover:text-blue-600 underline">
                      Checked baggage calculator
                    </Link>
                  </li>
                  <li className="py-3">
                    <Link href="/tools/excess-baggage-calculator" className="hover:text-blue-600 underline">
                      Overweight and oversize calculator
                    </Link>
                  </li>
                  <li className="py-3">
                    <Link href="/best-cards" className="hover:text-blue-600 underline">
                      Card bag-benefit calculator
                    </Link>
                  </li>
                  <li className="py-3">
                    <Link href="/airlines" className="hover:text-blue-600 underline">
                      Airline fee guides
                    </Link>
                  </li>
                  <li className="pt-3">
                    <Link href="/guides/travel-esims" className="hover:text-blue-600 underline">
                      Travel eSIM decision guide
                    </Link>
                  </li>
                </ul>
              </div>
            </aside>
          </div>

          {/* Improved Footer */}
          <footer className="mt-20 py-12 border-t border-slate-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 text-sm">
              <div>
                <span className="font-bold block mb-4 uppercase tracking-widest text-slate-400">
                  Resources
                </span>
                <div className="flex flex-col gap-2">
                  <Link href="/about" className="hover:text-blue-600 text-slate-600">
                    About the Project
                  </Link>
                  <Link href="/methodology" className="hover:text-blue-600 text-slate-600">
                    Our Methodology
                  </Link>
                </div>
              </div>
              <div>
                <span className="font-bold block mb-4 uppercase tracking-widest text-slate-400">
                  Legal
                </span>
                <div className="flex flex-col gap-2">
                  <Link href="/privacy" className="hover:text-blue-600 text-slate-600">
                    Privacy Policy
                  </Link>
                  <Link href="/contact" className="hover:text-blue-600 text-slate-600">
                    Contact Us
                  </Link>
                </div>
              </div>
              <div className="md:col-span-1">
                <Disclaimer />
              </div>
            </div>
            <p className="text-xs text-slate-400 border-t border-slate-100 pt-8">
              © 2026 Airline Fees Expert. Data and policies may change; verify critical details with the carrier when booking.
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
