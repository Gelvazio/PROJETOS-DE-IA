import { defineConfig } from 'vite'
import pwaPlugin from './pwa-plugin.js'

export default defineConfig({
  plugins: [pwaPlugin()],
  build: {
    target: 'esnext',
    rollupOptions: {
      input: [
        'index.html',
        'login.html',
        'financas-pessoais.html',
        'gestao-financeira.html',
        'gestao-de-novos-negocios.html'
      ]
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, '')
      }
    }
  }
})
