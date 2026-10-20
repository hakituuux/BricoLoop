import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// config de base, on verra plus tard si on a besoin d'un proxy vers l'api
export default defineConfig({
  plugins: [react()],
})