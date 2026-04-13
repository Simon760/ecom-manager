/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export for GitHub Pages
  output: 'export',
  // Add trailing slash for GitHub Pages compatibility
  trailingSlash: true,
  // Disable image optimization (not supported in static export)
  images: {
    unoptimized: true,
  },
  // Set base path if deploying to a subdirectory (e.g. /repo-name)
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  // Ensure assets are referenced correctly
  assetPrefix: process.env.NEXT_PUBLIC_BASE_PATH || '',
}

module.exports = nextConfig
