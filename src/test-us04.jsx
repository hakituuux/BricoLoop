import { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import DemandeEmprunt from './components/DemandeEmprunt.jsx'
import './index.css'
import './App.css'

// page de test temporaire pour US-04, a ne pas commit

const voisins = [
  { id: '1', firstName: 'Pierre' },
  { id: '2', firstName: 'Paul' },
  { id: '3', firstName: 'Jacque' },
  { id: '4', firstName: 'Fransceco' },
]

const outils = [
  { id: '1', ownerId: '1', name: 'Tournevis', category: 'Autre' },
  { id: '2', ownerId: '1', name: 'Marteau', category: 'Autre' },
  { id: '3', ownerId: '2', name: 'Pelle', category: 'Jardinage' },
  { id: '4', ownerId: '2', name: 'Râteau', category: 'Jardinage' },
  { id: '5', ownerId: '3', name: 'Paquet de vis', category: 'Perçage' },
  { id: '6', ownerId: '3', name: 'Tondeuse', category: 'Jardinage' },
  { id: '7', ownerId: '4', name: 'Tronçonneuse', category: 'Jardinage' },
  { id: '8', ownerId: '4', name: 'Hache', category: 'Jardinage' },
]

// un pret deja accepte sur la tondeuse, pour tester le 409
const pretsAcceptes = [
  { toolId: '6', startDate: '2026-11-10', endDate: '2026-11-15' },
]

// les demandes creees par la fausse api (en memoire, perdues au rechargement)
const demandes = []

// fausse api : imite les regles de POST /api/loans
window.fetch = async (url, options) => {
  const { toolId, startDate, endDate } = JSON.parse(options.body)
  const userId = options.headers['X-User-Id']
  const reponse = (status, body) =>
    new Response(JSON.stringify(body), { status })

  // petit delai pour voir le bouton "Envoi..."
  await new Promise((r) => setTimeout(r, 500))

  const outil = outils.find((o) => o.id === toolId)
  if (!outil) return reponse(404, { error: 'Outil introuvable' })
  if (!startDate || !endDate) {
    return reponse(400, { error: 'startDate et endDate sont obligatoires' })
  }
  if (endDate < startDate) {
    return reponse(400, {
      error: 'La date de fin est antérieure à la date de début',
    })
  }
  if (outil.ownerId === userId) {
    return reponse(400, {
      error: 'Vous ne pouvez pas emprunter votre propre outil',
    })
  }
  const chevauche = pretsAcceptes.some(
    (p) => p.toolId === toolId && startDate <= p.endDate && endDate >= p.startDate
  )
  if (chevauche) {
    return reponse(409, { error: 'Outil déjà prêté sur ces dates' })
  }
  const demande = {
    id: String(demandes.length + 1),
    toolId,
    borrowerId: userId,
    startDate,
    endDate,
    status: 'pending',
  }
  demandes.push(demande)
  // previent la page qu'il y a une nouvelle demande
  window.dispatchEvent(new Event('nouvelle-demande'))
  return reponse(201, demande)
}

function PageTest() {
  const [userId, setUserId] = useState('1')
  const [toolId, setToolId] = useState('3')
  const [, setNbDemandes] = useState(0)

  // on reaffiche la page a chaque nouvelle demande
  useEffect(() => {
    const maj = () => setNbDemandes(demandes.length)
    window.addEventListener('nouvelle-demande', maj)
    return () => window.removeEventListener('nouvelle-demande', maj)
  }, [])

  const demandesOutil = demandes.filter(
    (d) => d.toolId === toolId && d.status === 'pending'
  )

  const outil = outils.find((o) => o.id === toolId)
  const proprietaire = voisins.find((v) => v.id === outil?.ownerId)

  return (
    <div className="page">
      <header>
        <h1>Test US-04</h1>
        <label>
          Je suis :{' '}
          <select value={userId} onChange={(e) => setUserId(e.target.value)}>
            {voisins.map((v) => (
              <option key={v.id} value={v.id}>
                {v.firstName}
              </option>
            ))}
          </select>
        </label>{' '}
        <label>
          Outil :{' '}
          <select value={toolId} onChange={(e) => setToolId(e.target.value)}>
            {outils.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
            <option value="999">Outil inexistant (404)</option>
          </select>
        </label>
      </header>

      <div className="contenu">
        <h2>{outil ? outil.name : 'Outil inexistant'}</h2>
        {outil && (
          <p>
            {outil.category} · propriétaire : {proprietaire.firstName}
          </p>
        )}
        {/* key : on remet le formulaire a zero quand on change d'outil ou de voisin */}
        <DemandeEmprunt
          key={toolId + '-' + userId}
          toolId={toolId}
          ownerFirstName={proprietaire ? proprietaire.firstName : '?'}
          userId={userId}
        />

        <h3>Demandes en attente sur cet outil : {demandesOutil.length}</h3>
        <ul>
          {demandesOutil.map((d) => (
            <li key={d.id}>
              #{d.id} · {voisins.find((v) => v.id === d.borrowerId).firstName}{' '}
              · du {d.startDate} au {d.endDate} · {d.status}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<PageTest />)
