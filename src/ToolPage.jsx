import { useEffect, useState } from 'react'

const statuts = {
  available: 'Disponible',
  borrowed: 'Emprunté',
}

function ToolPage({ toolId, user, onBack }) {
  const [tool, setTool] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    let annule = false

    setLoading(true)
    setNotFound(false)
    setError(false)
    setTool(null)

    fetch('/api/tools/' + toolId)
      .then((res) => {
        // fetch ne plante pas sur un 404, il faut tester le status
        if (res.status === 404) {
          if (!annule) setNotFound(true)
          return null
        }
        if (!res.ok) {
          throw new Error('Erreur ' + res.status)
        }
        return res.json()
      })
      .then((data) => {
        if (!annule && data) setTool(data)
      })
      .catch(() => {
        if (!annule) setError(true)
      })
      .finally(() => {
        if (!annule) setLoading(false)
      })

    return () => {
      annule = true
    }
  }, [toolId])

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
        <p>Impossible de charger l’outil.</p>
        <button onClick={onBack}>Retour au catalogue</button>
      </div>
    )
  }

  const peutEmprunter = tool.status === 'available' && tool.owner.id !== user.id

  return (
    <div>
      <button onClick={onBack}>← Retour au catalogue</button>

      <h2>{tool.name}</h2>
      <p>Catégorie : {tool.category}</p>
      <p>{tool.description || 'Pas de description'}</p>
      <p>Statut : {statuts[tool.status] || tool.status}</p>
      <p>
        Proposé par {tool.owner.firstName} · {tool.owner.district}
      </p>

      {peutEmprunter && <button>Demander l’emprunt</button>}
    </div>
  )
}

export default ToolPage
