// app/layout.tsx

import type { Metadata } from "next";
import Link from "next/link";
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
      <body style={{ margin: 0 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
          <header style={{ marginBottom: 18 }}>
            <Link
              href="/"
              style={{
                display: "inline-block",
                fontSize: 18,
                fontWeight: 700,
                color: "inherit",
                textDecoration: "none",
              }}
            >
              Airline Fees Reference
            </Link>
          </header>

          <main>{children}</main>

          <footer style={{ marginTop: 28, paddingTop: 16, borderTop: "1px solid rgba(0,0,0,0.12)" }}>
            <Disclaimer />
          </footer>
        </div>
      </body>
    </html>
  );
}
