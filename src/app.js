import express from 'express'
import { users } from './data.js'

export function createApp() {
  const app = express()
  app.use(express.json())

  // pour le selecteur de profil, commun a tous les ecrans
  app.get('/api/users', (_req, res) => {
    res.json(users)
  })

  return app
}
