import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

import config from './config';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api/generate': {
          target: config.api.generationUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/generate/, '/generate/'),
        },
        '/api/predict': {
          target: config.api.predictionUrl,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/predict/, '/predict'),
          headers: {
            'Host': 'ampclass-api.medellin.unal.edu.co'
          }
        }
      }
    },
    plugins: [react()],
    define: {
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
