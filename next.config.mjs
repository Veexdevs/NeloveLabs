/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { serverActions: { bodySizeLimit: '10mb' } },
  allowedDevOrigins: ['*.e2b.app', 'localhost'],
};
export default nextConfig;
