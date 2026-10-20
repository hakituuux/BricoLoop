import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// config de base, on verra plus tard si on a besoin d'un proxy vers l'api
export default defineConfig({
  plugins: [react()],
  // un seul React meme si client/node_modules est installe
  resolve: { dedupe: ['react', 'react-dom'] },
  test: {
    // date du jour figee pour tous les tests (voir test/setup.js)
    setupFiles: ['test/setup.js'],
  },
})
