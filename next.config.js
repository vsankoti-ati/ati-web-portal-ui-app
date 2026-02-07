/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        // Don't fail build on ESLint errors during Docker build
        ignoreDuringBuilds: true,
    },
    typescript: {
        // Don't fail build on TypeScript errors during Docker build
        ignoreBuildErrors: true,
    },
    // Disable source maps in production for smaller builds
    productionBrowserSourceMaps: false,
    // Optimize images
    images: {
        unoptimized: true, // Disable image optimization for easier containerization
    },
};

module.exports = nextConfig;
