import { useEffect, useState } from 'react'
import './App.css'
import { apiFetch } from './api.js'
import { ProfilContext } from './ProfilContext.jsx'
import Catalogue from './Catalogue.jsx'
import Fiche from './Fiche.jsx'
import MesOutils from './MesOutils.jsx'

function App() {
  const [users, setUsers] = useState([])
  const [userId, setUserId] = useState('')
  const [erreurUsers, setErreurUsers] = useState('')
  const [chargement, setChargement] = useState(true)
  const [page, setPage] = useState('accueil')
  const [outilId, setOutilId] = useState(null)

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
            <button
              onClick={() => {
                setPage('accueil')
              }}
            >
              Accueil
            </button>
            <button
              onClick={() => {
                setPage('catalogue')
              }}
            >
              Catalogue
            </button>
            <button
              onClick={() => {
                setPage('mes-outils')
              }}
            >
              Ou sont mes outils
            </button>
          </div>
        </header>

        <div className="contenu">
          {page === 'accueil' && (
            <div>
              <h2>Accueil</h2>
              {user && (
                <p>
                  Bonjour {user.firstName}, quartier {user.district}.
                </p>
              )}
              {!user && <p>Choisis un profil, puis ouvre le catalogue.</p>}
              <button
                onClick={() => {
                  setPage('catalogue')
                }}
              >
                Voir le catalogue
              </button>{' '}
              <button
                onClick={() => {
                  setPage('mes-outils')
                }}
              >
                Ou sont mes outils
              </button>
            </div>
          )}
          {page === 'catalogue' && (
            <Catalogue
              onRetour={() => {
                setPage('accueil')
              }}
              onChoisir={(id) => {
                setOutilId(id)
                setPage('fiche')
              }}
            />
          )}
          {page === 'mes-outils' && (
            <MesOutils
              onRetour={() => {
                setPage('accueil')
              }}
            />
          )}
          {page === 'fiche' && (
            <Fiche
              outilId={outilId}
              onRetour={() => {
                setPage('catalogue')
              }}
            />
          )}
        </div>
      </div>
    </ProfilContext.Provider>
  )
}

export default App
