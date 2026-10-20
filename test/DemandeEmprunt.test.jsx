// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import DemandeEmprunt from '../src/components/DemandeEmprunt.jsx'

// date dans n jours au format AAAA-MM-JJ (heure locale, comme le composant)
function dansNJours(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  const mois = String(d.getMonth() + 1).padStart(2, '0')
  const jour = String(d.getDate()).padStart(2, '0')
  return d.getFullYear() + '-' + mois + '-' + jour
}

// remplace fetch par une fausse reponse de l'api
function mockApi(status, body) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), { status })
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

// affiche le formulaire, remplit les dates et envoie la demande
function envoyer(startDate, endDate, props = {}) {
  render(
    <DemandeEmprunt toolId="3" ownerFirstName="Paul" userId="1" {...props} />
  )
  fireEvent.change(screen.getByLabelText(/Début/), {
    target: { value: startDate },
  })
  fireEvent.change(screen.getByLabelText(/Fin/), {
    target: { value: endDate },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Envoyer la demande' }))
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('US-04 · formulaire de demande d emprunt', () => {
  it('envoie POST /api/loans avec toolId, dates et X-User-Id', async () => {
    const fetchMock = mockApi(201, { id: '1', status: 'pending' })
    envoyer(dansNJours(5), dansNJours(7))

    await screen.findByRole('status')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/loans')
    expect(options.method).toBe('POST')
    expect(options.headers['X-User-Id']).toBe('1')
    expect(JSON.parse(options.body)).toEqual({
      toolId: '3',
      startDate: dansNJours(5),
      endDate: dansNJours(7),
    })
  })

  it('demande creee (201) : affiche le message en attente avec le prenom', async () => {
    mockApi(201, { id: '1', status: 'pending' })
    envoyer(dansNJours(5), dansNJours(7))

    const message = await screen.findByRole('status')
    expect(message.textContent).toBe(
      'Demande envoyée, en attente de la réponse de Paul'
    )
  })

  it('date de fin avant la date de debut (400) : affiche le message de l api', async () => {
    mockApi(400, { error: 'La date de fin est antérieure à la date de début' })
    envoyer(dansNJours(7), dansNJours(5))

    const message = await screen.findByRole('alert')
    expect(message.textContent).toBe(
      'La date de fin est antérieure à la date de début'
    )
  })

  it('mon propre outil (400) : affiche le message de l api', async () => {
    mockApi(400, { error: 'Vous ne pouvez pas emprunter votre propre outil' })
    envoyer(dansNJours(5), dansNJours(7), { userId: '2' })

    const message = await screen.findByRole('alert')
    expect(message.textContent).toBe(
      'Vous ne pouvez pas emprunter votre propre outil'
    )
  })

  it('outil inconnu (404) : affiche le message de l api', async () => {
    mockApi(404, { error: 'Outil introuvable' })
    envoyer(dansNJours(5), dansNJours(7))

    const message = await screen.findByRole('alert')
    expect(message.textContent).toBe('Outil introuvable')
  })

  it('outil deja prete (409) : affiche le message de l api', async () => {
    mockApi(409, { error: 'Outil déjà prêté sur ces dates' })
    envoyer(dansNJours(5), dansNJours(7))

    const message = await screen.findByRole('alert')
    expect(message.textContent).toBe('Outil déjà prêté sur ces dates')
  })

  it('erreur sans message json : affiche le code', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('oups', { status: 500 }))
    )
    envoyer(dansNJours(5), dansNJours(7))

    const message = await screen.findByRole('alert')
    expect(message.textContent).toBe('Erreur 500')
  })

  it('api injoignable : affiche un message clair', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('reseau')))
    envoyer(dansNJours(5), dansNJours(7))

    const message = await screen.findByRole('alert')
    expect(message.textContent).toBe('Impossible de contacter le serveur.')
  })

  it('plusieurs demandes : on peut renvoyer une demande apres la premiere', async () => {
    const fetchMock = mockApi(201, { id: '1', status: 'pending' })
    envoyer(dansNJours(5), dansNJours(7))
    await screen.findByRole('status')

    // le bouton est de nouveau actif, une 2e demande part
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: '2', status: 'pending' }), {
        status: 201,
      })
    )
    const bouton = screen.getByRole('button', { name: 'Envoyer la demande' })
    fireEvent.click(bouton)
    await screen.findByRole('status')

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('pas de date dans le passe : les champs ont aujourd hui comme minimum', () => {
    render(<DemandeEmprunt toolId="3" ownerFirstName="Paul" userId="1" />)

    expect(screen.getByLabelText(/Début/).getAttribute('min')).toBe(
      dansNJours(0)
    )
    expect(screen.getByLabelText(/Fin/).getAttribute('min')).toBe(
      dansNJours(0)
    )
  })
})
