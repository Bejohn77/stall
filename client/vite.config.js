import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const spaFallback = () => ({
  name: 'spa-fallback',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      if (req.method !== 'GET') return next()

      const pathname = req.url.split('?')[0]
      if (
        pathname.startsWith('/api') ||
        pathname.startsWith('/@react-refresh') ||
        pathname.startsWith('/@vite/') ||
        pathname.includes('.') ||
        pathname === '/@vite/client'
      ) {
        return next()
      }

      req.url = '/'
      next()
    })
  },
})

export default defineConfig({
  plugins: [react(), tailwindcss(), spaFallback()],
  appType: 'spa',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
