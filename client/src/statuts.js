// libelles affiches a l'ecran
export function libelleStatut(status) {
  if (status === 'available') {
    return 'Disponible'
  }
  if (status === 'lent') {
    return 'Prêté'
  }
  if (status === 'unavailable') {
    return 'Indisponible'
  }
  return status
}
