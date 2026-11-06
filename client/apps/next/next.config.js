const path = require('path')

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  turbopack: {
    resolveAlias: {
      'react-native': 'react-native-web',
      'react-native/Libraries/EventEmitter/RCTDeviceEventEmitter':
        'react-native-web/dist/vendor/react-native/EventEmitter/RCTDeviceEventEmitter',
      'react-native/Libraries/vendor/emitter/EventEmitter':
        'react-native-web/dist/vendor/react-native/vendor/emitter/EventEmitter',
      'react-native/Libraries/EventEmitter/NativeEventEmitter':
        'react-native-web/dist/vendor/react-native/EventEmitter/NativeEventEmitter',
    },
    resolveExtensions: [
      '.web.tsx',
      '.web.ts',
      '.web.jsx',
      '.web.js',
      '.tsx',
      '.ts',
      '.jsx',
      '.js',
      '.mjs',
      '.json',
      '.wasm',
    ],
    root: path.resolve(__dirname, '../..'),
  },
}

/**
 * @type {import('next').NextConfig}
 */
module.exports = {
  ...nextConfig,

  typescript: {
    ignoreBuildErrors: true,
  },

  transpilePackages: [
    'expo-blur',
    'expo-linear-gradient',
    'react-native-web',
    'solito',
    'moti',
    'react-native-safe-area-context',
    'react-native-maps',
    'app',
  ],

  compiler: {
    define: {
      __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
    },
  },
  reactStrictMode: false,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'dummyimage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
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

}
