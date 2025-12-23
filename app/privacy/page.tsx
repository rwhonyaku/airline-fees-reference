import { Metadata } from "next";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Privacy Policy",
  alternates: {
    canonical: canonical("/privacy"),
  },
};

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: 800 }}>
      <h1 style={{ fontSize: 20, marginTop: 0 }}>Privacy Policy</h1>

      <p>
        This site publishes factual reference information about airline fees.
        We do not require user accounts and do not collect personal information
        directly.
      </p>

      <h2 style={{ fontSize: 16 }}>Information collection</h2>
      <p>
        This site may use third-party services such as Google Analytics and
        Google AdSense. These services may collect limited, non-personally
        identifiable information such as IP address, browser type, and pages
        visited, in accordance with their own privacy policies.
      </p>

      <h2 style={{ fontSize: 16 }}>Cookies</h2>
      <p>
        Third-party vendors, including Google, may use cookies to serve ads
        based on a user’s prior visits to this or other websites. Google’s use
        of advertising cookies enables it and its partners to serve ads based
        on visits to this site and/or other sites on the internet.
      </p>

      <p>
        Users may opt out of personalized advertising by visiting
        <a
          href="https://www.google.com/settings/ads"
          target="_blank"
          rel="noopener noreferrer"
        >
          {" "}Google Ad Settings
        </a>.
      </p>

      <h2 style={{ fontSize: 16 }}>External links</h2>
      <p>
        This site contains links to external websites operated by airlines and
        other third parties. We are not responsible for the content or privacy
        practices of those sites.
      </p>

      <h2 style={{ fontSize: 16 }}>Updates</h2>
      <p>
        This policy may be updated periodically to reflect changes in services
        or regulatory requirements.
      </p>
    </div>
  );
}
