/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Only use standalone output for non-Vercel deployments (e.g., Docker)
  // Vercel handles Next.js deployments natively and doesn't need standalone
  ...(process.env.VERCEL ? {} : { output: "standalone" }),
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    NEON_REST_URL: process.env.NEON_REST_URL,
  },
  // Transpile GSAP packages to fix ES module import issues during SSR
  transpilePackages: ["gsap"],
};

export default nextConfig;
