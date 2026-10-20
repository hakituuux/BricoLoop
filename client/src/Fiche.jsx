import { useEffect, useState } from 'react'
import { apiFetch } from './api.js'
import { useProfil } from './ProfilContext.jsx'
import { libelleStatut } from './statuts.js'

function Fiche(props) {
  const profil = useProfil()
  const [outil, setOutil] = useState(null)
  const [erreur, setErreur] = useState('')
  const [chargement, setChargement] = useState(true)
  const [montrerForm, setMontrerForm] = useState(false)
  const [debut, setDebut] = useState('')
  const [fin, setFin] = useState('')
  const [message, setMessage] = useState('')
  const [erreurDemande, setErreurDemande] = useState('')

  useEffect(() => {
    let annule = false

    async function charger() {
      const res = await apiFetch('/api/tools/' + props.outilId, profil.userId)
      if (annule) {
        return
      }
      setChargement(false)
      if (!res.ok) {
        setErreur(res.error || "Cet outil n'existe pas")
        setOutil(null)
        return
      }
      setOutil(res.data)
    }

    charger()

    return () => {
      annule = true
    }
  }, [props.outilId, profil.userId])

  async function envoyer(e) {
    e.preventDefault()
    setMessage('')
    setErreurDemande('')

    const res = await apiFetch('/api/loans', profil.userId, {
      method: 'POST',
      body: {
        toolId: props.outilId,
        startDate: debut,
        endDate: fin,
      },
    })

    if (!res.ok) {
      setErreurDemande(res.error)
      return
    }

    setMessage(
      'Demande envoyée, en attente de la réponse de ' + outil.firstName
    )
  }

  if (chargement) {
    return <p>Chargement de la fiche...</p>
  }

  if (erreur !== '' || !outil) {
    return (
      <div>
        <button onClick={props.onRetour}>Retour au catalogue</button>
        <p className="erreur">{erreur || "Cet outil n'existe pas"}</p>
      </div>
    )
  }

  let description = outil.description
  if (!description) {
    description = 'Pas de description'
  }

  const aMoi = String(outil.ownerId) === String(profil.userId)
  const dispo = outil.status === 'available'

  return (
    <div>
      <button onClick={props.onRetour}>Retour au catalogue</button>
      <h2>{outil.name}</h2>
      <p>{outil.category}</p>
      <p>{description}</p>
      <p className="badge">{libelleStatut(outil.status)}</p>
      <p>
        Proposé par {outil.firstName} · {outil.district}
      </p>

      {dispo && !aMoi && (
        <button
          onClick={() => {
            setMontrerForm(true)
          }}
        >
          Demander l'emprunt
        </button>
      )}

      {aMoi && <p>C'est ton outil.</p>}

      {montrerForm && (
        <form onSubmit={envoyer}>
          <p>
            <label>
              Debut{' '}
              <input
                type="date"
                value={debut}
                onChange={(e) => {
                  setDebut(e.target.value)
                }}
              />
            </label>
          </p>
          <p>
            <label>
              Fin{' '}
              <input
                type="date"
                value={fin}
                onChange={(e) => {
                  setFin(e.target.value)
                }}
              />
            </label>
          </p>
          <button type="submit">Envoyer la demande</button>
          {erreurDemande !== '' && <p className="erreur">{erreurDemande}</p>}
          {message !== '' && <p className="ok">{message}</p>}
        </form>
      )}
    </div>
  )
}

export default Fiche
