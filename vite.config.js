import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/test': {
        target: 'https://audit.seo-performance.ru:3000',
        changeOrigin: true,
        secure: false, // если используешь самоподписанный SSL-сертификат
        rewrite: (path) => path.replace(/^\/test/, '/test')
      }
    }
  }
})
