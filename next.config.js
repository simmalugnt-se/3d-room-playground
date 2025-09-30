/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Configure webpack for Three.js and other 3D libraries
  webpack: (config, { isServer }) => {
    // Handle canvas and other browser-only modules on server side
    if (isServer) {
      config.externals.push('canvas');
    }
    
    return config;
  },
};

module.exports = nextConfig;