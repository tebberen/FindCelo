/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/.well-known/farcaster.json',
        destination: 'https://api.farcaster.xyz/miniapps/hosted-manifest/019ded7c-c786-52d8-ad85-e7281e89719a',
        permanent: false,
      },
    ];
  },
};

module.exports = nextConfig;
