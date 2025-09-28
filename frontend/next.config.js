// /** @type {import('next').NextConfig} */
// const nextConfig = { reactStrictMode: true };
// module.exports = nextConfig;
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      { source: '/api/upload', destination: 'http://localhost:4000/api/upload' },
    ];
  },
};
module.exports = nextConfig;
