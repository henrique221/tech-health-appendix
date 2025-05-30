/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configure domains that are allowed to be used with next/image
  images: {
    domains: ['avatars.githubusercontent.com'],
  },
  // Enable React StrictMode for development
  reactStrictMode: true,
  
  // Desativar verificação do ESLint durante o build
  eslint: {
    // Não trate avisos como erros durante o build
    ignoreDuringBuilds: true,
  },
  
  // Desativar verificação de tipos durante o build
  typescript: {
    // Não trate erros de tipo como erros durante o build
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
