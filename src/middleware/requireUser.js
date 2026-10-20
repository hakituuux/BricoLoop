// Identifie l'utilisateur via l'en-tête X-User-Id. Absent ou vide → 401.
export function requireUser(req, res, next) {
  const raw = req.get('X-User-Id');
  const userId = typeof raw === 'string' ? raw.trim() : '';

  if (userId === '') {
    return res.status(401).json({ error: 'En-tête X-User-Id manquant' });
  }

  req.userId = userId;
  return next();
}
