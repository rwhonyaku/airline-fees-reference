import type { Metadata } from "next";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Contact",
  alternates: { canonical: canonical("/contact") },
};

export default function ContactPage() {
  return (
    <div style={{ maxWidth: 800 }}>
      <h1 style={{ fontSize: 20, marginTop: 0 }}>Contact</h1>

      <p>
        For corrections (with a source link) or site issues, email:
      </p>

      <p>
        <a href="mailto:contact@airline-fees.com">contact@airline-fees.com</a>
      </p>

      <p style={{ opacity: 0.9 }}>
        Include the airline, fee category, and the URL of the airline source page.
      </p>
    </div>
  );
}
