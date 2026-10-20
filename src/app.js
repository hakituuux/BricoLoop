import express from 'express'
import { categories, loans, tools, users } from './data.js'
import { signalerOutilAbime } from './routes/damage.js'
import { createLoansRouter } from './routes/loans.js'

// minuscules et sans accents : « Perçage » et « percage » se comparent pareil
function normaliser(texte) {
  return String(texte ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
}

export function createApp() {
  const app = express()
  app.use(express.json())

  app.get('/api/users', (_req, res) => {
    res.json(users)
  })

  // US-10 : ?category=Perçage pour filtrer le catalogue
  // US-11 : ?q=perceuse cherche dans le nom et la description (combinable)
  // les outils disponibles d'abord, puis les autres
  app.get('/api/tools', (req, res) => {
    const { category, q } = req.query
    let liste = tools

    if (category !== undefined) {
      if (!categories.includes(category)) {
        return res
          .status(400)
          .json({ error: 'Catégorie inconnue', field: 'category' })
      }
      liste = liste.filter((t) => t.category === category)
    }

    if (q !== undefined) {
      if (typeof q !== 'string') {
        return res
          .status(400)
          .json({ error: 'Recherche invalide', field: 'q' })
      }
      // decision du PO : un q vide renvoie la liste complete
      const motCle = normaliser(q.trim())
      liste = liste.filter(
        (t) =>
          normaliser(t.name).includes(motCle) ||
          normaliser(t.description).includes(motCle)
      )
    }

    res.json([
      ...liste.filter((t) => t.status === 'available'),
      ...liste.filter((t) => t.status !== 'available'),
    ])
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
      let enAttente = 0
      for (let j = 0; j < loans.length; j++) {
        if (String(loans[j].toolId) !== String(tools[i].id)) {
          continue
        }
        if (loans[j].status === 'pending') {
          enAttente = enAttente + 1
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
          status: loans[j].status,
          emprunteur: emprunteur,
        })
      }

      liste.push({
        id: tools[i].id,
        name: tools[i].name,
        category: tools[i].category,
        pendingCount: enAttente,
        demandes: demandes,
      })
    }

    res.json(liste)
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

  // rebranches apres le merge US-08 qui les avait perdus
  app.post('/api/tools/:id/damage', signalerOutilAbime)
  app.use('/api/loans', createLoansRouter())

  return app
}
