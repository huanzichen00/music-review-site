import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const allowedHosts = (env.VITE_ALLOWED_HOSTS || 'localhost,127.0.0.1')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const apiBaseUrl = env.VITE_API_BASE_URL || 'http://localhost:8080';

  return {
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return;
            }
            if (id.includes('@ant-design/icons')) {
              return 'vendor-antd-icons';
            }
            if (id.includes('antd')) {
              return 'vendor-antd';
            }
            if (id.includes('axios')) {
              return 'vendor-axios';
            }
            if (id.includes('react') || id.includes('scheduler')) {
              return 'vendor-react';
            }
            return 'vendor-misc';
          },
        },
      },
    },
    server: {
      host: true, // Listen on all interfaces for LAN/dev tunnel scenarios.
      port: 3000,
      allowedHosts,
      proxy: {
        '/api': {
          target: apiBaseUrl,
          changeOrigin: true,
        },
      },
    },
  };
});
