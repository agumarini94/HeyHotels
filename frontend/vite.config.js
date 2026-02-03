import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174, // Forzamos a que use el 5174
    strictPort: true, // Si el 5174 está ocupado, dará error en vez de irse al 5175
  }
})
