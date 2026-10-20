import express from 'express'
import { tools, users } from './data.js'
import { signalerOutilAbime } from './routes/damage.js'

export function createApp() {
  const app = express()
  app.use(express.json())

  // pour le selecteur de profil, commun a tous les ecrans
  app.get('/api/users', (_req, res) => {
    res.json(users)
  })

  app.get('/api/tools', (_req, res) => {
    res.json(tools)
  })

  // fiche outil : on ajoute le proprietaire (retrouve avec ownerId)
  app.get('/api/tools/:id', (req, res) => {
    const tool = tools.find((t) => t.id === req.params.id)

    if (!tool) {
      return res.status(404).json({ error: 'Outil introuvable' })
    }

    const owner = users.find((u) => u.id === tool.ownerId) ?? null
    res.json({ ...tool, owner })
  })

  app.post('/api/tools/:id/damage', signalerOutilAbime)

  return app
}
