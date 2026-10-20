import express from 'express'
import { tools, users } from './data.js'

export function createApp() {
  const app = express()
  app.use(express.json())

  // pour le selecteur de profil, commun a tous les ecrans
  app.get('/api/users', (_req, res) => {
    res.json(users)
  })

  // le test deja present sur main appelle cette route
  app.get('/api/tools', (_req, res) => {
    res.json(tools)
  })

  return app
}
