import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* 1. Tashqi rasmlar (Unsplash) uchun xavfsiz ruxsat berish */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'dummyimage.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'fakestoreapi.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      }
    ],
  },

  /* 2. React Strict Mode fon rejimida yoqilgan, lekin qo'lda boshqarish uchun (ixtiyoriy) */
  reactStrictMode: true,

  /* 3. Build vaqtida linting va TS xatolarini tekshirish (ixtiyoriy) */
  // eslint: { ignoreDuringBuilds: false }, // Xato bo'lsa build to'xtaydi (Tavsiya etiladi)
  // typescript: { ignoreBuildErrors: false }, 
};

export default nextConfig;