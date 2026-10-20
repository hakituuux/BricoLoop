import { Router } from 'express'
import { loans, tools } from '../data.js'

// US-05 : le proprietaire accepte ou refuse une demande d'emprunt
// POST /api/loans/:id/accept  → demande acceptee, outil prete
// POST /api/loans/:id/refuse  → demande refusee, outil inchange
export function createLoansRouter() {
  const router = Router()

  router.post('/:id/accept', (req, res) => repondre(req, res, 'accepted'))
  router.post('/:id/refuse', (req, res) => repondre(req, res, 'refused'))

  return router
}

function repondre(req, res, decision) {
  const userId = (req.get('X-User-Id') ?? '').trim()
  if (userId === '') {
    return res.status(401).json({ error: 'En-tête X-User-Id manquant' })
  }

  const loan = loans.find((l) => l.id === req.params.id)
  if (!loan) {
    return res.status(404).json({ error: 'Demande introuvable' })
  }

  // seul le proprietaire de l'outil peut repondre
  const tool = tools.find((t) => t.id === loan.toolId)
  if (!tool || tool.ownerId !== userId) {
    return res
      .status(403)
      .json({ error: 'Seul le propriétaire de l\'outil peut répondre à la demande' })
  }

  // on ne repond qu'a une demande en attente
  if (loan.status !== 'pending') {
    return res
      .status(409)
      .json({ error: 'Cette demande n\'est plus en attente' })
  }

  if (decision === 'accepted') {
    // garde-fou : on ne prete pas deux fois le meme outil
    if (tool.status === 'lent') {
      return res.status(409).json({ error: 'Cet outil est déjà prêté' })
    }
    loan.status = 'accepted'
    tool.status = 'lent'
  } else {
    loan.status = 'refused'
  }

  return res.json({ ...loan, tool })
}
