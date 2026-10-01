/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  async rewrites() {
    return [
      {
        source: '/backend-api/:path*',
        destination: 'http://127.0.0.1:8000/api/:path*',
      },
      {
        source: '/backend-uploads/:path*',
        destination: 'http://127.0.0.1:8000/uploads/:path*',
      },
    ];
  },
};

export default nextConfig;
