import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async redirects() {
    return [
      // vehicle-verification absorbed pre-purchase-inspection into one
      // consolidated "Verification & Inspection" listing (see
      // app/services/_data.js) — keep the old URL alive for anyone who
      // bookmarked or shared it.
      {
        source: "/services/pre-purchase-inspection",
        destination: "/services/vehicle-verification",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
