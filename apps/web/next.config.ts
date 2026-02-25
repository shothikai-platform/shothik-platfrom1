import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  allowedDevOrigins: [
    'localhost',
    'localhost:5000',
    '127.0.0.1',
    '127.0.0.1:5000',
    '0.0.0.0',
    '0.0.0.0:5000',
    '*.replit.dev',
    '*.replit.app',
    '*.pike.replit.dev',
    '*.spock.replit.dev',
    '*.kirk.replit.dev',
  ],
  async rewrites() {
    return [
      {
        source: '/api/paraphrase-with-variantV2',
        destination: 'http://127.0.0.1:8080/api/v1/paraphrase',
      },
      {
        source: '/api/paraphrase/:path*',
        destination: 'http://127.0.0.1:8080/api/v1/paraphrase/:path*',
      },
    ];
  },
};

export default nextConfig;
