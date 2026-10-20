import { useState } from 'react'
import ReactDOM from 'react-dom/client'
import MesEmprunts from './components/MesEmprunts.jsx'
import { loans, tools, users } from './data.js'
// styles de la page, partages avec le client
import '../client/src/index.css'
import '../client/src/App.css'

// page de test temporaire pour US-08, a ne pas commit

// fausse api : imite GET /api/loans/mine avec les donnees de demo de data.js
window.fetch = async (url, options) => {
  const userId = options.headers['X-User-Id']
  const reponse = (status, body) =>
    new Response(JSON.stringify(body), { status })

  // petit delai pour voir le "Chargement..."
  await new Promise((r) => setTimeout(r, 500))

  if (!users.some((u) => u.id === userId)) {
    return reponse(401, { error: 'Choisissez un profil (en-tete X-User-Id)' })
  }

  const mine = loans
    .filter((l) => l.borrowerId === userId)
    .map((l) => ({
      ...l,
      toolName: tools.find((t) => t.id === l.toolId).name,
    }))
    .sort((a, b) => a.startDate.localeCompare(b.startDate))

  return reponse(200, mine)
}

function PageTest() {
  const [userId, setUserId] = useState('1')

  // toutes les demandes, pour comparer avec ce que voit le voisin choisi
  const toutes = loans.filter((l) => l.borrowerId !== userId)

  return (
    <div className="page">
      <header>
        <h1>Test US-08</h1>
        <label>
          Je suis :{' '}
          <select value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">Aucun profil</option>
            {users.map((v) => (
              <option key={v.id} value={v.id}>
                {v.firstName}
              </option>
            ))}
            <option value="999">Profil inconnu (401)</option>
          </select>
        </label>
      </header>

      <div className="contenu">
        <MesEmprunts userId={userId} />

        <h3>Demandes des autres voisins (ne doivent pas apparaitre) : {toutes.length}</h3>
        <ul>
          {toutes.map((d) => (
            <li key={d.id}>
              #{d.id} · {users.find((v) => v.id === d.borrowerId).firstName} ·{' '}
              {tools.find((t) => t.id === d.toolId).name} · du {d.startDate} au{' '}
              {d.endDate} · {d.status}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<PageTest />)
