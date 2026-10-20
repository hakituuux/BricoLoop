import { useEffect, useState } from 'react'
import './App.css'
import { apiFetch } from './api.js'
import { ProfilContext } from './ProfilContext.jsx'

function App() {
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

  let user = null
  for (let i = 0; i < users.length; i++) {
    if (users[i].id === userId) {
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
        </header>

        <div className="contenu">
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
      </div>
    </ProfilContext.Provider>
  )
}

export default App
