import { createCivicAuthPlugin } from "@civic/auth/nextjs";
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Silence warnings
  // https://github.com/WalletConnect/walletconnect-monorepo/issues/1908
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
};

const withCivicAuth = createCivicAuthPlugin({
  clientId: "80ef9024-dc21-45a9-8aba-f9215d7de88d",
});

export default withCivicAuth(nextConfig);
