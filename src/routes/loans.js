import { Router } from 'express'
import { loans, tools, users } from '../data.js'
import { pretAccepteEnConflit, pretEnCoursDe } from '../overlap.js'

const FORMAT_DATE = /^\d{4}-\d{2}-\d{2}$/

// vraie date du calendrier au format AAAA-MM-JJ (refuse 2026-02-30)
function estDateValide(valeur) {
  if (typeof valeur !== 'string' || !FORMAT_DATE.test(valeur)) {
    return false
  }
  const d = new Date(valeur + 'T00:00:00Z')
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === valeur
}

function prochainId() {
  const max = loans.reduce((m, l) => Math.max(m, Number(l.id) || 0), 0)
  return String(max + 1)
}

// US-04 / US-06 : un voisin demande a emprunter un outil
// POST /api/loans  body { toolId, startDate, endDate }
// → 201 demande en attente · 400 { error, field } · 401 · 404
// → 409 si un pret accepte chevauche ces dates (US-06)
function creerDemande(req, res) {
  const userId = req.get('X-User-Id')
  const user = users.find((u) => u.id === userId)
  if (!user) {
    return res
      .status(401)
      .json({ error: 'Choisissez un profil (en-tete X-User-Id)' })
  }

  const { toolId, startDate, endDate } = req.body ?? {}

  if (typeof toolId !== 'string' || toolId.trim() === '') {
    return res
      .status(400)
      .json({ error: 'L\'outil est obligatoire', field: 'toolId' })
  }
  if (!estDateValide(startDate)) {
    return res.status(400).json({
      error: 'La date de début doit être au format AAAA-MM-JJ',
      field: 'startDate',
    })
  }
  if (!estDateValide(endDate)) {
    return res.status(400).json({
      error: 'La date de fin doit être au format AAAA-MM-JJ',
      field: 'endDate',
    })
  }
  if (endDate < startDate) {
    return res.status(400).json({
      error: 'La date de fin est antérieure à la date de début',
      field: 'endDate',
    })
  }

  const tool = tools.find((t) => t.id === toolId)
  if (!tool) {
    return res.status(404).json({ error: 'Outil introuvable' })
  }
  if (tool.ownerId === user.id) {
    return res.status(400).json({
      error: 'Vous ne pouvez pas emprunter votre propre outil',
      field: 'toolId',
    })
  }
  if (tool.status === 'unavailable') {
    return res.status(409).json({ error: 'Outil indisponible' })
  }

  // US-06 (decision du PO) : un seul outil emprunte a la fois par personne
  if (pretEnCoursDe(user.id)) {
    return res.status(409).json({
      error: 'Vous avez déjà un outil emprunté : rendez-le avant d\'en réserver un autre',
    })
  }

  // US-06 : pas de demande sur des dates deja promises a un autre voisin
  if (pretAccepteEnConflit(tool.id, startDate, endDate)) {
    return res.status(409).json({ error: 'Outil déjà prêté sur ces dates' })
  }

  const loan = {
    id: prochainId(),
    toolId: tool.id,
    borrowerId: user.id,
    startDate,
    endDate,
    status: 'pending',
  }
  loans.push(loan)
  return res.status(201).json(loan)
}

// US-05 : le proprietaire accepte ou refuse une demande d'emprunt
// POST /api/loans/:id/accept  → demande acceptee, outil prete
// POST /api/loans/:id/refuse  → demande refusee, outil inchange
// US-07 : POST /api/loans/:id/return → pret rendu, outil disponible
export function createLoansRouter() {
  const router = Router()

  router.post('/', creerDemande)
  router.post('/:id/accept', (req, res) => repondre(req, res, 'accepted'))
  router.post('/:id/refuse', (req, res) => repondre(req, res, 'refused'))

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

  // US-13 : le proprietaire note l'emprunteur apres le retour
  // POST /api/loans/:id/rating  body { rating } (entier de 1 a 5)
  // → 200 pret avec sa note · 400 { error, field } · 403 · 404
  // → 409 si le pret n'est pas rendu ou deja note
  router.post('/:id/rating', (req, res) => {
    const loan = loans.find((l) => l.id === req.params.id)
    if (!loan) {
      return res.status(404).json({ error: 'Prêt introuvable' })
    }

    const tool = tools.find((t) => t.id === loan.toolId)
    const userId = req.get('X-User-Id')
    if (!tool || tool.ownerId !== userId) {
      return res
        .status(403)
        .json({ error: 'Seul le propriétaire peut noter l\'emprunteur' })
    }

    const { rating } = req.body ?? {}
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        error: 'La note doit être un entier de 1 à 5',
        field: 'rating',
      })
    }

    if (loan.status !== 'returned') {
      return res
        .status(409)
        .json({ error: 'Seul un prêt rendu peut être noté' })
    }
    if (loan.rating !== undefined) {
      return res.status(409).json({ error: 'Ce prêt a déjà été noté' })
    }

    loan.rating = rating
    res.json(loan)
  })

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
    // US-06 : deux demandes en attente peuvent se chevaucher, mais une fois
    // l'une acceptee, l'autre ne peut plus l'etre
    if (pretAccepteEnConflit(tool.id, loan.startDate, loan.endDate, loan.id)) {
      return res
        .status(409)
        .json({ error: 'Un prêt déjà accepté chevauche ces dates' })
    }
    // l'emprunteur a peut-etre fait plusieurs demandes en attente :
    // une seule peut etre acceptee tant que l'outil n'est pas rendu
    if (pretEnCoursDe(loan.borrowerId, loan.id)) {
      return res
        .status(409)
        .json({ error: 'Cet emprunteur a déjà un outil emprunté' })
    }
    loan.status = 'accepted'
    tool.status = 'lent'
  } else {
    loan.status = 'refused'
  }

  return res.json({ ...loan, tool })
}
