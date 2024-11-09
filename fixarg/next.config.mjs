/** @type {import('next').NextConfig} */
import dotenv from 'dotenv';
dotenv.config();
const nextConfig = {
  
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
    ];
  },
};

export default nextConfig;
