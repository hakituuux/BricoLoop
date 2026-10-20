import { tools } from '../data.js'

// le proprietaire signale que son outil est abime : il devient indisponible
// POST /api/tools/:id/damage  body optionnel : { comment }
export function signalerOutilAbime(req, res) {
  const tool = tools.find((t) => t.id === req.params.id)
  if (!tool) {
    return res.status(404).json({ error: 'Outil introuvable' })
  }

  const userId = req.get('X-User-Id')
  if (tool.ownerId !== userId) {
    return res
      .status(403)
      .json({ error: 'Seul le propriétaire peut signaler son outil abîmé' })
  }

  const comment = req.body?.comment ?? ''
  if (typeof comment !== 'string' || comment.trim().length > 300) {
    return res.status(400).json({
      error: 'Le commentaire doit être un texte de 300 caractères maximum',
      field: 'comment',
    })
  }

  // un outil prete est chez l'emprunteur : il faut d'abord declarer le retour
  if (tool.status === 'lent') {
    return res
      .status(409)
      .json({ error: 'Outil prêté : déclarez d\'abord son retour' })
  }
  if (tool.status === 'unavailable') {
    return res.status(409).json({ error: 'Outil déjà signalé indisponible' })
  }

  tool.status = 'unavailable'
  tool.damage = {
    comment: comment.trim(),
    reportedAt: new Date().toISOString(),
  }
  res.json(tool)
}
