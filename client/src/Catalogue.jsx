import { useEffect, useState } from 'react'
import { apiFetch } from './api.js'
import { useProfil } from './ProfilContext.jsx'
import { libelleStatut } from './statuts.js'

function Catalogue(props) {
  const profil = useProfil()
  const [outils, setOutils] = useState(null)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    let annule = false

    async function charger() {
      const res = await apiFetch('/api/tools', profil.userId)
      if (annule) {
        return
      }
      if (!res.ok) {
        setErreur(res.error)
        setOutils([])
        return
      }
      setErreur('')
      setOutils(res.data)
    }

    charger()

    return () => {
      annule = true
    }
  }, [profil.userId])

  if (outils === null && erreur === '') {
    return <p>Chargement du catalogue...</p>
  }

  if (erreur !== '') {
    return (
      <div>
        <button onClick={props.onRetour}>Retour</button>
        <p className="erreur">{erreur}</p>
      </div>
    )
  }

  return (
    <div>
      <button onClick={props.onRetour}>Retour</button>
      <h2>Catalogue</h2>
      {outils.length === 0 && <p>Aucun outil pour le moment</p>}
      {outils.map((outil) => {
        return (
          <div
            className="carte"
            key={outil.id}
            onClick={() => {
              props.onChoisir(outil.id)
            }}
          >
            <p>
              <b>{outil.name}</b>
            </p>
            <p>{outil.category}</p>
            <p className="badge">{libelleStatut(outil.status)}</p>
            {outil.damage && <p className="erreur">Abîmé</p>}
          </div>
        )
      })}
    </div>
  )
}

export default Catalogue
