/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },
  // Ensure proper handling of async components
  reactStrictMode: true,
  // Add webpack configuration to handle node-fetch
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ensure node-fetch is available in server builds
      config.externals = [...(config.externals || []), 'node-fetch'];
    }
    return config;
  },
}

module.exports = nextConfig
