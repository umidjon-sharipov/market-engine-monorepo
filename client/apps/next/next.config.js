const path = require('path')

/**
 * @type {import('next').NextConfig}
 */
const withWebpack = {
  webpack(config) {
    if (!config.resolve) {
      config.resolve = {}
    }

    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'react-native': 'react-native-web',
      'react-native$': 'react-native-web',
      'react-native-gesture-handler': 'react-native-gesture-handler',
      'react-native/Libraries/EventEmitter/RCTDeviceEventEmitter$':
        'react-native-web/dist/vendor/react-native/NativeEventEmitter/RCTDeviceEventEmitter',
      'react-native/Libraries/vendor/emitter/EventEmitter$':
        'react-native-web/dist/vendor/react-native/emitter/EventEmitter',
      'react-native/Libraries/EventEmitter/NativeEventEmitter$':
        'react-native-web/dist/vendor/react-native/NativeEventEmitter',
    }

    config.resolve.extensions = [
      '.web.js',
      '.web.jsx',
      '.web.ts',
      '.web.tsx',
      ...(config.resolve?.extensions ?? []),
    ]

    return config
  },
}

/**
 * @type {import('next').NextConfig}
 */
const withTurpopack = {
  turbopack: {
    resolveAlias: {
      'react-native': 'react-native-web',
      'expo-linking': 'react-native-web',
      'react-native-gesture-handler': 'react-native-gesture-handler',
      'react-native/Libraries/EventEmitter/RCTDeviceEventEmitter$':
        'react-native-web/dist/vendor/react-native/NativeEventEmitter/RCTDeviceEventEmitter',
      'react-native/Libraries/vendor/emitter/EventEmitter$':
        'react-native-web/dist/vendor/react-native/emitter/EventEmitter',
      'react-native/Libraries/EventEmitter/NativeEventEmitter$':
        'react-native-web/dist/vendor/react-native/NativeEventEmitter',
    },
    resolveExtensions: [
      '.web.js',
      '.web.jsx',
      '.web.ts',
      '.web.tsx',
      '.js',
      '.mjs',
      '.tsx',
      '.ts',
      '.jsx',
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
  typescript: {
    ignoreBuildErrors: true, 
  },
  
  transpilePackages: [
    'react-native',
    'react-native-web',
    'solito',
    'react-native-reanimated',
    'moti',
    'react-native-gesture-handler',
    'react-native-safe-area-context',
    'expo-blur',
    'react-native-maps'
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

  ...withWebpack,
  ...withTurpopack,
}