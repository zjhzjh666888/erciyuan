/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: false,
  },
  transpilePackages: ['@erciyuan/types', '@erciyuan/mock-town'],
}

export default nextConfig
