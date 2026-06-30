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
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="text-4xl font-black text-slate-900 mb-8 tracking-tight">Privacy Policy</h1>

      <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed">
        <p className="text-lg">
          At <strong>Airline-Fees.com</strong>, we prioritize the privacy of our visitors. This policy outlines the types of information collected and how it is used. As a factual reference site, we do not require user accounts or direct personal data submissions.
        </p>

        <hr className="my-8 border-slate-100" />

        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-3">Google DoubleClick DART Cookie</h2>
          <p>
            Google is one of the third-party vendors on our site. It also uses cookies, known as DART cookies, to serve ads to our site visitors based upon their visit to our site and other sites on the internet. However, visitors may choose to decline the use of DART cookies by visiting the Google ad and content network Privacy Policy at the following URL – <a href="https://policies.google.com/technologies/ads" className="text-blue-600 underline">https://policies.google.com/technologies/ads</a>
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-3">Log Files & Analytics</h2>
          <p>
            Airline-Fees.com follows a standard procedure of using log files. These files log visitors when they visit websites. The information collected by log files includes internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-3">Advertising Partners</h2>
          <p>
            Third-party ad servers or ad networks use technologies like cookies, JavaScript, or Web Beacons that are used in their respective advertisements and links that appear on Airline-Fees.com, which are sent directly to users' browsers. They automatically receive your IP address when this occurs. These technologies are used to measure the effectiveness of their advertising campaigns and/or to personalize the advertising content that you see.
          </p>
        </section>

        <section className="mb-8 p-6 bg-slate-50 rounded-xl border border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 mb-3">CCPA & GDPR Rights</h2>
          <p className="mb-4 text-sm">
            Depending on your location, you may have the following rights regarding your data:
          </p>
          <ul className="list-disc pl-5 text-sm space-y-2">
            <li>The right to request that a business delete any personal data about the consumer that a business has collected.</li>
            <li>The right to request that a business that sells a consumer's personal data, not sell the consumer's personal data.</li>
            <li>The right to access, rectify, or erase any personal data collected by third-party services.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-3">External Links</h2>
          <p>
            Our site contains links to airline websites and other third parties. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party sites or services.
          </p>
        </section>

        <section className="pt-8 border-t border-slate-100 text-sm text-slate-500">
          <p>Last Updated: February 2026</p>
          <p className="mt-2">
            If you have additional questions or require more information about our Privacy Policy, do not hesitate to contact us.
          </p>
        </section>
      </div>
    </main>
  );
}