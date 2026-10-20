import { useEffect, useState } from 'react'
import './MesEmprunts.css'

// libelles des statuts de demande affiches a l'ecran
function libelleStatut(status) {
  if (status === 'pending') {
    return 'En attente'
  }
  if (status === 'accepted') {
    return 'Acceptée'
  }
  if (status === 'refused') {
    return 'Refusée'
  }
  return status
}

// AAAA-MM-JJ -> JJ/MM/AAAA
function formatDate(date) {
  const morceaux = date.split('-')
  return morceaux[2] + '/' + morceaux[1] + '/' + morceaux[0]
}

// US-08 : liste de mes demandes et de mes emprunts
// props : userId (voisin choisi dans la liste, envoye dans le header X-User-Id)
// l'api renvoie deja la liste triee par date de debut, avec le nom de l'outil
function MesEmprunts({ userId }) {
  const [demandes, setDemandes] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    if (!userId) {
      return
    }

    // evite d'afficher la reponse d'un ancien voisin si on change vite de profil
    let annule = false

    async function charger() {
      setChargement(true)
      setErreur('')

      try {
        const res = await fetch('/api/loans/mine', {
          headers: { 'X-User-Id': userId },
        })

        let data = null
        try {
          data = await res.json()
        } catch {
          // pas de json dans la reponse
        }

        if (annule) {
          return
        }

        if (res.ok) {
          setDemandes(data || [])
        } else {
          // 401... on affiche le message error de l'api tel quel
          setDemandes([])
          setErreur(data && data.error ? data.error : 'Erreur ' + res.status)
        }
      } catch {
        if (annule) {
          return
        }
        setErreur('Impossible de contacter le serveur.')
      }

      setChargement(false)
    }

    charger()

    return () => {
      annule = true
    }
  }, [userId])

  if (!userId) {
    return (
      <section className="mes-emprunts">
        <h3>Mes emprunts</h3>
        <p>Choisissez votre profil pour voir vos emprunts.</p>
      </section>
    )
  }

  return (
    <section className="mes-emprunts">
      <h3>Mes emprunts</h3>

      {chargement && <p>Chargement...</p>}

      {!chargement && erreur && (
        <p className="message erreur" role="alert">
          {erreur}
        </p>
      )}

      {!chargement && !erreur && demandes.length === 0 && (
        <p>Vous n'avez aucune demande pour le moment.</p>
      )}

      {!chargement && demandes.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Outil</th>
              <th>Du</th>
              <th>Au</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {demandes.map((d) => (
              <tr key={d.id}>
                <td>{d.toolName}</td>
                <td>{formatDate(d.startDate)}</td>
                <td>{formatDate(d.endDate)}</td>
                <td className={'statut ' + d.status}>
                  {libelleStatut(d.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

export default MesEmprunts
