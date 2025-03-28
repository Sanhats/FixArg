/** @type {import('next').NextConfig} */
import dotenv from 'dotenv';
dotenv.config();
const nextConfig = {
  // Configuración optimizada para Vercel
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  
  // Optimización de CSS para evitar problemas de carga
  optimizeFonts: true,
  compiler: {
    // Eliminar clases CSS no utilizadas en producción
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Configuración para manejo de assets estáticos
  images: {
    domains: ['vercel.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Mantener optimización de imágenes en Vercel
    unoptimized: false,
  },
  
  // Configuración específica para CSS Modules
  webpack: (config) => {
    // Asegurar que los módulos CSS se procesen correctamente
    const rules = config.module.rules
    .find((rule) => typeof rule.oneOf === 'object')
    .oneOf.filter((rule) => Array.isArray(rule.use));
    
    rules.forEach((rule) => {
      rule.use.forEach((moduleLoader) => {
        if (moduleLoader.loader?.includes('css-loader') && !moduleLoader.loader?.includes('postcss-loader')) {
          if (moduleLoader.options?.modules) {
            moduleLoader.options.modules.exportLocalsConvention = 'camelCase';
          }
        }
      });
    });
    
    return config;
  },
  
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
      {
        // Configuración para archivos estáticos
        source: '/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

export default nextConfig;
