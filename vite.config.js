import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/elevation-api': {
        target: 'https://api.open-elevation.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/elevation-api/, ''),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Elevation API proxy error:', err)
          })
        }
      },
      // 新增：高德地图高程API代理（中国境内可访问）
      '/amap-elevation': {
        target: 'https://restapi.amap.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/amap-elevation/, '/v3/assistant/coordinate/convert'),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('AMap Elevation API proxy error:', err)
          })
        }
      }
    }
  }
})
