import express from 'express'
import { categories, loans, tools, users } from './data.js'
import { signalerOutilAbime } from './routes/damage.js'
import { createLoansRouter } from './routes/loans.js'

export function createApp() {
  const app = express()
  app.use(express.json())

  // pour le selecteur de profil, commun a tous les ecrans
  app.get('/api/users', (_req, res) => {
    res.json(users)
  })

  // US-10 : ?category=Perçage pour filtrer le catalogue
  app.get('/api/tools', (req, res) => {
    const { category } = req.query
    if (category === undefined) {
      return res.json(tools)
    }

    if (!categories.includes(category)) {
      return res
        .status(400)
        .json({ error: 'Catégorie inconnue', field: 'category' })
    }

    res.json(tools.filter((t) => t.category === category))
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

  // US-08 : mes demandes (X-User-Id), avec le nom de l'outil,
  // triees par date de debut croissante
  app.get('/api/loans/mine', (req, res) => {
    const userId = req.get('X-User-Id')
    const user = users.find((u) => u.id === userId)

    if (!user) {
      return res
        .status(401)
        .json({ error: 'Choisissez un profil (en-tete X-User-Id)' })
    }

    const mine = loans
      .filter((l) => l.borrowerId === user.id)
      .map((l) => {
        const tool = tools.find((t) => t.id === l.toolId)
        return { ...l, toolName: tool ? tool.name : null }
      })
      // dates AAAA-MM-JJ : l'ordre alphabetique est l'ordre chronologique
      .sort((a, b) => a.startDate.localeCompare(b.startDate))

    res.json(mine)
  })

  app.post('/api/tools/:id/damage', signalerOutilAbime)
  app.use('/api/loans', createLoansRouter())

  return app
}
