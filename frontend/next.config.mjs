const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: "/backend-api/:path*",
        destination: "http://127.0.0.1:3001/api/:path*",
      },
    ];
  },
};

export default nextConfig;
