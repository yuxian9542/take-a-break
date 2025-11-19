import 'tsx/esm';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'node:path';

const { loadWebClientEnv } = await import('@take-a-break/config');

const reactNativeShim = path.resolve(__dirname, './src/shims/react-native.ts');

loadWebClientEnv({ envDir: __dirname });

const config = {
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: '@',
        replacement: path.resolve(__dirname, './src')
      },
      {
        find: 'react-native/Libraries/Utilities/codegenNativeComponent',
        replacement: path.resolve(__dirname, './src/shims/codegenNativeComponent.tsx')
      },
      {
        find: 'react-native',
        replacement: reactNativeShim
      },
      {
        find: '@take-a-break/mobile-src',
        replacement: path.resolve(__dirname, '../mobile/src')
      },
      {
        find: '@take-a-break/map/react',
        replacement: path.resolve(__dirname, '../../packages/map/src/react/index.ts')
      },
      {
        find: '@take-a-break/map',
        replacement: path.resolve(__dirname, '../../packages/map/src/index.ts')
      },
      {
        find: 'lucide-react-native',
        replacement: 'lucide-react'
      }
    ],
    extensions: ['.web.tsx', '.web.ts', '.ts', '.tsx', '.js', '.jsx', '.json']
  },
  optimizeDeps: {
    exclude: ['react-native', 'react-native/Libraries/Utilities/codegenNativeComponent']
  },
  define: {
    __DEV__: process.env.NODE_ENV !== 'production'
  },
  server: {
    port: 5174,
    host: true
  },
  test: {
    environment: 'jsdom'
  }
};

export default defineConfig(config);
