import { Router } from 'express'
import { loans, tools } from '../data.js'

export function createLoansRouter() {
  const router = Router()

  // US-07 : le proprietaire declare que l'outil lui a ete rendu
  router.post('/:id/return', (req, res) => {
    const loan = loans.find((l) => l.id === req.params.id)
    if (!loan) {
      return res.status(404).json({ error: 'Prêt introuvable' })
    }

    const tool = tools.find((t) => t.id === loan.toolId)
    const userId = req.get('X-User-Id')
    if (!tool || tool.ownerId !== userId) {
      return res
        .status(403)
        .json({ error: 'Seul le propriétaire peut déclarer le retour' })
    }

    // decision du PO : seul un pret accepte peut etre rendu
    if (loan.status !== 'accepted') {
      return res
        .status(409)
        .json({ error: 'Seul un prêt accepté peut être rendu' })
    }

    loan.status = 'returned'
    tool.status = 'available'
    res.json({ ...loan, tool })
  })

  return router
}
