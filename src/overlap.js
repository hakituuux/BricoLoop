import { loans } from './data.js'

// US-06 : deux prets acceptes ne doivent jamais se chevaucher.
// Les dates sont au format AAAA-MM-JJ et les bornes sont incluses :
// un pret du 10 au 15 occupe l'outil le 10 ET le 15.
// Avec ce format, comparer les chaines revient a comparer les dates.
export function seChevauchent(a, b) {
  return a.startDate <= b.endDate && b.startDate <= a.endDate
}

// renvoie le pret accepte qui chevauche les dates donnees pour cet outil,
// ou undefined s'il n'y en a pas. excludeId : pret a ignorer (lui-meme).
export function pretAccepteEnConflit(toolId, startDate, endDate, excludeId) {
  return loans.find(
    (l) =>
      l.toolId === toolId &&
      l.status === 'accepted' &&
      l.id !== excludeId &&
      seChevauchent(l, { startDate, endDate })
  )
}
