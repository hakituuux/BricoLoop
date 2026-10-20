import { useState } from 'react'
import './DemandeEmprunt.css'

// date du jour au format AAAA-MM-JJ, en heure locale
// (toISOString donne l'heure UTC, ce qui decale d'un jour vers minuit)
function aujourdhui() {
  const d = new Date()
  const mois = String(d.getMonth() + 1).padStart(2, '0')
  const jour = String(d.getDate()).padStart(2, '0')
  return d.getFullYear() + '-' + mois + '-' + jour
}

// US-04 : formulaire de demande d'emprunt, a mettre sur la fiche d'un outil
// props : toolId (id de l'outil), ownerFirstName (prenom du proprietaire),
// userId (voisin choisi dans la liste, envoye dans le header X-User-Id)
function DemandeEmprunt({ toolId, ownerFirstName, userId }) {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [succes, setSucces] = useState('')
  const [erreur, setErreur] = useState('')

  // pas de demande dans le passe : le navigateur bloque l'envoi
  // si une date est avant aujourd'hui
  const dateMin = aujourdhui()

  async function envoyerDemande(e) {
    e.preventDefault()
    setEnvoi(true)
    setSucces('')
    setErreur('')

    try {
      // les input date renvoient deja le format AAAA-MM-JJ
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
        },
        body: JSON.stringify({ toolId, startDate, endDate }),
      })

      if (res.status === 201) {
        setSucces(
          'Demande envoyée, en attente de la réponse de ' + ownerFirstName
        )
      } else {
        // 400, 404, 409... on affiche le message error de l'api tel quel
        let message = 'Erreur ' + res.status
        try {
          const data = await res.json()
          if (data && data.error) {
            message = data.error
          }
        } catch {
          // pas de json dans la reponse, on garde le message par defaut
        }
        setErreur(message)
      }
    } catch {
      setErreur('Impossible de contacter le serveur.')
    }

    setEnvoi(false)
  }

  return (
    <form className="demande-emprunt" onSubmit={envoyerDemande}>
      <h3>Demander l'emprunt</h3>

      <div className="dates">
        <label>
          Début{' '}
          <input
            type="date"
            value={startDate}
            min={dateMin}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>

        <label>
          Fin{' '}
          <input
            type="date"
            value={endDate}
            min={dateMin}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>
      </div>

      <button type="submit" disabled={envoi}>
        {envoi ? 'Envoi...' : 'Envoyer la demande'}
      </button>

      {succes && (
        <p className="message succes" role="status">
          {succes}
        </p>
      )}
      {erreur && (
        <p className="message erreur" role="alert">
          {erreur}
        </p>
      )}
    </form>
  )
}

export default DemandeEmprunt
