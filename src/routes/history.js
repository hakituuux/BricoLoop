import { loans, tools, users } from '../data.js'

// US-14 : le proprietaire consulte l'historique des prets d'un outil
// GET /api/tools/:id/history  (X-User-Id = proprietaire)
// → 200 prets acceptes et rendus, du plus recent au plus ancien
// → 401 sans profil · 403 si ce n'est pas le proprietaire · 404 outil inconnu
const STATUTS_HISTORIQUE = ['accepted', 'returned']

export function historiqueOutil(req, res) {
  const userId = (req.get('X-User-Id') ?? '').trim()
  if (userId === '') {
    return res
      .status(401)
      .json({ error: 'Choisissez un profil (en-tete X-User-Id)' })
  }

  const tool = tools.find((t) => t.id === req.params.id)
  if (!tool) {
    return res.status(404).json({ error: 'Outil introuvable' })
  }

  if (tool.ownerId !== userId) {
    return res.status(403).json({
      error: 'Seul le propriétaire peut consulter l\'historique de cet outil',
    })
  }

  const historique = loans
    .filter((l) => l.toolId === tool.id && STATUTS_HISTORIQUE.includes(l.status))
    .map((l) => {
      const emprunteur = users.find((u) => u.id === l.borrowerId) ?? null
      return {
        ...l,
        borrower: emprunteur
          ? { id: emprunteur.id, firstName: emprunteur.firstName }
          : null,
      }
    })
    // le plus recent d'abord : dates AAAA-MM-JJ, donc tri alphabetique inverse
    // a date de debut egale, celui qui finit le plus tard d'abord
    .sort(
      (a, b) =>
        b.startDate.localeCompare(a.startDate) ||
        b.endDate.localeCompare(a.endDate)
    )

  return res.json(historique)
}
