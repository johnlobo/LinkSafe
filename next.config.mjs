import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { version } = require('./package.json');

const isDev = process.env.NODE_ENV === 'development';
const BASE_PATH = isDev ? '/proxy/9002' : '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  skipTrailingSlashRedirect: true,
  // code-server proxy config — dev only (production runs at root via reverse proxy)
  ...(isDev && {
    basePath: BASE_PATH,
    allowedDevOrigins: ['code-server.digitalpartners.es'],
  }),
  env: {
    NEXT_PUBLIC_APP_BASEPATH: BASE_PATH,
    NEXT_PUBLIC_APP_VERSION: version,
  },
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
