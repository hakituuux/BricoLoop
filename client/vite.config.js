import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// les appels /api partent vers le serveur express (npm start, port 3000)
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
