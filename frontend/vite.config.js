import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
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
    host: true,  // 监听所有网络接口，允许局域网访问
    port: 3000,
    allowedHosts: ['lifelessly-fibrillose-tonia.ngrok-free.dev', '.ngrok-free.dev', '.ngrok.io'],
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  }
})
