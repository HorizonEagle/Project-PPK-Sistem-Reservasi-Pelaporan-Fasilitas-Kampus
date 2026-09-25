import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  // CORS headers — diterapkan oleh Next.js ke SEMUA response termasuk
  // auto-generated OPTIONS preflight, sehingga browser menerima preflight
  // dengan benar sebelum mengirim request sebenarnya.
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "http://localhost:3000" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, PATCH, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization, X-Requested-With" },
          { key: "Access-Control-Max-Age", value: "86400" },
        ],
      },
    ];
  },
};

export default nextConfig;
