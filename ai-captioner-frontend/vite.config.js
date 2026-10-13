import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // In development, /api requests go to the Express backend, so no CORS setup is needed
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
})
