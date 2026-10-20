import { useState } from 'react'
import './App.css'

// voisins en dur pour l'instant
// plus tard ça viendra de l'api, avec le header X-User-Id
const voisins = [
  { id: '1', firstName: 'Lea', district: 'Belleville' },
  { id: '2', firstName: 'Karim', district: 'Croix-Rousse' },
  { id: '3', firstName: 'Ines', district: 'Vieux-Lille' },
  { id: '4', firstName: 'Hugo', district: 'Chartrons' },
]

function App() {
  const [userId, setUserId] = useState('1')
  const [page, setPage] = useState('accueil')

  // on cherche le voisin choisi (un peu a la main)
  let user = voisins[0]
  for (let i = 0; i < voisins.length; i++) {
    if (voisins[i].id === userId) {
      user = voisins[i]
    }
  }

  return (
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
            {voisins.map((v) => {
              return (
                <option key={v.id} value={v.id}>
                  {v.firstName} ({v.district})
                </option>
              )
            })}
          </select>
        </label>

        <div className="menu">
          <button onClick={() => setPage('accueil')}>Accueil</button>
          <button onClick={() => setPage('catalogue')}>Catalogue</button>
        </div>
      </header>

      <div className="contenu">
        {page === 'accueil' && (
          <div>
            <h2>Bonjour {user.firstName}</h2>
            <p>Quartier : {user.district}</p>
            <p>
              La base React est en place. On branchera les user stories une par
              une (catalogue, fiche outil, demande de pret...).
            </p>
          </div>
        )}

        {page === 'catalogue' && (
          <div>
            <h2>Catalogue</h2>
            <p>Aucun outil pour le moment.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
