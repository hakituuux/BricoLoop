import express from 'express'
import { loans, tools, users } from './data.js'

export function createApp() {
  const app = express()
  app.use(express.json())

  app.get('/api/users', (_req, res) => {
    res.json(users)
  })

  app.get('/api/tools', (_req, res) => {
    const liste = []
    for (let i = 0; i < tools.length; i++) {
      if (tools[i].status === 'available') {
        liste.push(tools[i])
      }
    }
    for (let i = 0; i < tools.length; i++) {
      if (tools[i].status !== 'available') {
        liste.push(tools[i])
      }
    }
    res.json(liste)
  })

  app.get('/api/tools/:id', (req, res) => {
    let outil = null
    for (let i = 0; i < tools.length; i++) {
      if (String(tools[i].id) === String(req.params.id)) {
        outil = tools[i]
      }
    }
    if (!outil) {
      res.status(404).json({ error: "Cet outil n'existe pas" })
      return
    }

    let proprio = null
    for (let i = 0; i < users.length; i++) {
      if (String(users[i].id) === String(outil.ownerId)) {
        proprio = users[i]
      }
    }

    res.json({
      ...outil,
      firstName: proprio ? proprio.firstName : '',
      district: proprio ? proprio.district : '',
      owner: proprio,
    })
  })

  app.get('/api/mes-outils', (req, res) => {
    const userId = req.header('X-User-Id')
    if (!userId) {
      res.status(401).json({ error: 'Choisissez votre profil' })
      return
    }

    const liste = []
    for (let i = 0; i < tools.length; i++) {
      if (String(tools[i].ownerId) !== String(userId)) {
        continue
      }

      const demandes = []
      for (let j = 0; j < loans.length; j++) {
        if (String(loans[j].toolId) !== String(tools[i].id)) {
          continue
        }
        let emprunteur = 'quelquun'
        for (let k = 0; k < users.length; k++) {
          if (String(users[k].id) === String(loans[j].borrowerId)) {
            emprunteur = users[k].firstName
          }
        }
        demandes.push({
          id: loans[j].id,
          startDate: loans[j].startDate,
          endDate: loans[j].endDate,
          emprunteur: emprunteur,
        })
      }

      liste.push({
        id: tools[i].id,
        name: tools[i].name,
        category: tools[i].category,
        demandes: demandes,
      })
    }

    res.json(liste)
  })

  app.post('/api/loans', (req, res) => {
    const userId = req.header('X-User-Id')
    if (!userId) {
      res.status(401).json({ error: 'Choisissez votre profil' })
      return
    }

    const body = req.body || {}
    const startDate = body.startDate
    const endDate = body.endDate
    const toolId = body.toolId

    if (!startDate || !endDate) {
      res.status(400).json({
        error: 'Les dates sont obligatoires',
        field: 'startDate',
      })
      return
    }
    if (endDate < startDate) {
      res.status(400).json({
        error: 'La date de fin est avant la date de debut',
        field: 'endDate',
      })
      return
    }

    let outil = null
    for (let i = 0; i < tools.length; i++) {
      if (String(tools[i].id) === String(toolId)) {
        outil = tools[i]
      }
    }
    if (!outil) {
      res.status(404).json({ error: "Cet outil n'existe pas" })
      return
    }
    if (String(outil.ownerId) === String(userId)) {
      res.status(400).json({ error: 'Tu ne peux pas emprunter ton propre outil' })
      return
    }
    if (outil.status !== 'available') {
      res.status(409).json({ error: "Cet outil n'est pas disponible" })
      return
    }

    const demande = {
      id: String(loans.length + 1),
      toolId: String(toolId),
      borrowerId: String(userId),
      startDate: startDate,
      endDate: endDate,
      status: 'pending',
    }
    loans.push(demande)
    res.status(201).json(demande)
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

  return app
}
