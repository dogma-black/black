import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // --- AÑADIR ESTE BLOQUE 'server' ---
  server: {
    proxy: {
      // Redirige cualquier petición que comience con /api
      // al servidor backend de FastAPI que corre en el puerto 8000.
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
})
