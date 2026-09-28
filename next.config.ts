import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/fees/same_day_change",
        destination: "/fees/change_cancellation",
        permanent: true,
      },
      {
        source: "/fees/same_day_standby",
        destination: "/fees/change_cancellation",
        permanent: true,
      },
      {
        source: "/fees/credit_card_exemption",
        destination: "/guides/airline-credit-card-baggage-benefits",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
