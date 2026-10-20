import { useEffect, useState } from 'react'
import { apiFetch } from './api.js'
import { useProfil } from './ProfilContext.jsx'
import { libelleStatut } from './statuts.js'

function ToolPage({ toolId, onBack }) {
  const { userId, user } = useProfil()
  const [tool, setTool] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let annule = false

    async function charger() {
      setLoading(true)
      setNotFound(false)
      setError('')
      setTool(null)

      const res = await apiFetch('/api/tools/' + toolId, userId)
      if (annule) {
        return
      }

      if (res.status === 404) {
        setNotFound(true)
      } else if (!res.ok) {
        setError(res.error)
      } else {
        setTool(res.data)
      }
      setLoading(false)
    }

    charger()

    return () => {
      annule = true
    }
  }, [toolId, userId])

  if (loading) {
    return <p>Chargement...</p>
  }

  if (notFound) {
    return (
      <div>
        <h2>Cet outil n’existe pas</h2>
        <a
          href="#catalogue"
          onClick={(e) => {
            e.preventDefault()
            onBack()
          }}
        >
          Retour au catalogue
        </a>
      </div>
    )
  }

  if (error || !tool) {
    return (
      <div>
        <p className="erreur">{error || 'Impossible de charger l’outil.'}</p>
        <button onClick={onBack}>Retour au catalogue</button>
      </div>
    )
  }

  // on ne peut pas emprunter son propre outil (ni sans profil choisi)
  const peutEmprunter =
    tool.status === 'available' &&
    user !== null &&
    tool.owner !== null &&
    tool.owner.id !== user.id

  return (
    <div>
      <button onClick={onBack}>← Retour au catalogue</button>

      <h2>{tool.name}</h2>
      <p>Catégorie : {tool.category}</p>
      <p>{tool.description || 'Pas de description'}</p>
      <p>Statut : {libelleStatut(tool.status)}</p>
      {tool.owner && (
        <p>
          Proposé par {tool.owner.firstName} · {tool.owner.district}
        </p>
      )}

      {peutEmprunter && <button>Demander l’emprunt</button>}
    </div>
  )
}

export default ToolPage
