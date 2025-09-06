/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow development access from different origins (network access)
  experimental: {
    allowedDevOrigins: [
      '192.168.100.66',
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      // Add your local network IP range if needed
      /^192\.168\.\d+\.\d+$/,
      'local-origin.dev', '*.local-origin.dev'
    ],
  },
  
  // Silence warnings
  // https://github.com/WalletConnect/walletconnect-monorepo/issues/1908
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
};

export default nextConfig;