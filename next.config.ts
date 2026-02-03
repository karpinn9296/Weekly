/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // 개발 중엔 PWA 끄기
});

const nextConfig = {
  // 기존 설정 유지
  images: {
    unoptimized: true,
  },
};

module.exports = withPWA(nextConfig);