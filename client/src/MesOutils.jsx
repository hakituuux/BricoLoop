import { useEffect, useState } from 'react'
import { apiFetch } from './api.js'
import { useProfil } from './ProfilContext.jsx'

function dateDuJour() {
  const d = new Date()
  let mois = String(d.getMonth() + 1)
  let jour = String(d.getDate())
  if (mois.length === 1) {
    mois = '0' + mois
  }
  if (jour.length === 1) {
    jour = '0' + jour
  }
  return d.getFullYear() + '-' + mois + '-' + jour
}

function ouEstOutil(demande) {
  const auj = dateDuJour()
  if (auj < demande.startDate) {
    return 'Pas encore parti. Il sera chez ' + demande.emprunteur
  }
  if (auj > demande.endDate) {
    return 'Retourne chez moi'
  }
  return 'Chez ' + demande.emprunteur
}

function MesOutils(props) {
  const profil = useProfil()
  const [outils, setOutils] = useState(null)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    let annule = false

    async function charger() {
      if (!profil.userId) {
        setErreur('Choisissez votre profil')
        setOutils([])
        return
      }
      const res = await apiFetch('/api/mes-outils', profil.userId)
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
    return <p>Chargement de tes outils...</p>
  }

  return (
    <div>
      <button onClick={props.onRetour}>Retour</button>
      <h2>Ou sont mes outils</h2>
      {erreur !== '' && <p className="erreur">{erreur}</p>}
      {outils && outils.length === 0 && erreur === '' && (
        <p>Tu n'as pas d'outil.</p>
      )}
      {outils &&
        outils.map((outil) => {
          return (
            <div className="carte" key={outil.id}>
              <p>
                <b>{outil.name}</b> ({outil.category})
              </p>
              {outil.demandes.length === 0 && <p>Il est chez moi.</p>}
              {outil.demandes.map((demande) => {
                return (
                  <div key={demande.id}>
                    <p>
                      Du {demande.startDate} au {demande.endDate}
                    </p>
                    <p>{ouEstOutil(demande)}</p>
                  </div>
                )
              })}
            </div>
          )
        })}
    </div>
  )
}

export default MesOutils
