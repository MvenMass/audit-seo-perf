import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://109.172.37.52:8080',  // ← ТВОЙ сервер
        changeOrigin: true,
        secure: false
      }
    }
  }
})
