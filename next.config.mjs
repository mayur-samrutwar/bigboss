/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@selfxyz/core', '@selfxyz/qrcode'],
  experimental: {
    esmExternals: 'loose',
  },
  webpack: (config, { isServer }) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    
    // Fix for JSON import assertions in Node.js 18+
    if (isServer) {
      config.module.rules.push({
        test: /\.json$/,
        type: 'json',
      });
    }
    
    // Handle i18n-iso-countries JSON imports specifically
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    
    // Add fallback for JSON modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
    };
    
    return config;
  },
};

export default nextConfig;
