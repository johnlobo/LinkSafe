const isDev = process.env.NODE_ENV === 'development';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // code-server proxy config — dev only (production runs at root via reverse proxy)
  ...(isDev && {
    basePath: '/proxy/9002',
    allowedDevOrigins: ['code-server.digitalpartners.es'],
  }),
  webpack: (config) => {
    config.resolve.alias['@opentelemetry/exporter-jaeger'] = false;
    return config;
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
