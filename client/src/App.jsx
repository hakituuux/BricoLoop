import { useEffect, useState } from 'react'
import './App.css'
import { apiFetch } from './api.js'
import { ProfilContext } from './ProfilContext.jsx'
import ToolPage from './ToolPage.jsx'

function App() {
  const [page, setPage] = useState('accueil')
  const [toolId, setToolId] = useState(null)
  const [tools, setTools] = useState([])
  const [users, setUsers] = useState([])
  const [userId, setUserId] = useState('')
  const [erreurUsers, setErreurUsers] = useState('')
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    let annule = false

    async function charger() {
      const res = await apiFetch('/api/users', '')
      if (annule) {
        return
      }
      if (!res.ok) {
        setErreurUsers(res.error)
        setChargement(false)
        return
      }
      setUsers(res.data)
      setChargement(false)
    }

    charger()

    return () => {
      annule = true
    }
  }, [])

  // liste minimale pour pouvoir ouvrir une fiche (le vrai catalogue = autre US)
  useEffect(() => {
    if (page !== 'catalogue') {
      return
    }

    let annule = false

    async function chargerOutils() {
      const res = await apiFetch('/api/tools', userId)
      if (annule) {
        return
      }
      setTools(res.ok ? res.data : [])
    }

    chargerOutils()

    return () => {
      annule = true
    }
  }, [page, userId])

  let user = null
  for (let i = 0; i < users.length; i++) {
    // la valeur d'un <select> est toujours une string, l'id de l'API peut etre un nombre
    if (String(users[i].id) === String(userId)) {
      user = users[i]
    }
  }

  return (
    <ProfilContext.Provider value={{ userId, user, users }}>
      <div className="page">
        <header>
          <h1>BricoLoop</h1>
          <p>Emprunte un outil pres de chez toi, au lieu d'en acheter un.</p>

          <label>
            Je suis :{' '}
            <select
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value)
              }}
            >
              <option value="">Choisissez votre profil</option>
              {users.map((v) => {
                return (
                  <option key={v.id} value={v.id}>
                    {v.firstName} ({v.district})
                  </option>
                )
              })}
            </select>
          </label>

          {chargement && <p>Chargement des voisins...</p>}
          {erreurUsers && <p className="erreur">{erreurUsers}</p>}

          <div className="menu">
            <button onClick={() => setPage('accueil')}>Accueil</button>
            <button onClick={() => setPage('catalogue')}>Catalogue</button>
          </div>
        </header>

        <div className="contenu">
          {page === 'accueil' && (
            <div>
              {user && (
                <p>
                  Profil actif : {user.firstName}, quartier {user.district}. Les
                  appels a l'API partiront avec l'en-tete X-User-Id.
                </p>
              )}
              {!user && <p>Aucun profil choisi pour le moment.</p>}
              <p>
                La base commune est en place. Catalogue, fiche, ajout d'outil et
                demande d'emprunt seront branches story par story.
              </p>
            </div>
          )}

          {page === 'catalogue' && (
            <div>
              <h2>Catalogue</h2>
              {tools.length === 0 && <p>Aucun outil pour le moment.</p>}
              <ul>
                {tools.map((t) => (
                  <li key={t.id}>
                    <button
                      onClick={() => {
                        setToolId(t.id)
                        setPage('outil')
                      }}
                    >
                      {t.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {page === 'outil' && (
            <ToolPage toolId={toolId} onBack={() => setPage('catalogue')} />
          )}
        </div>
      </div>
    </ProfilContext.Provider>
  )
}

export default App
