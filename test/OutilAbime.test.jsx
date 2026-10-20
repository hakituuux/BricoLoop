// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import { ProfilContext } from '../client/src/ProfilContext.jsx'
import Fiche from '../client/src/Fiche.jsx'
import Catalogue from '../client/src/Catalogue.jsx'

const marteau = {
  id: '2',
  ownerId: '2',
  name: 'Marteau',
  category: 'Autre',
  description: 'Marteau de charpentier',
  status: 'available',
  firstName: 'Paul',
  district: 'Gare',
}

const marteauAbime = {
  ...marteau,
  status: 'unavailable',
  damage: { comment: 'Manche fendu', reportedAt: '2026-10-20T10:00:00Z' },
}

// fausses reponses de l'api, dans l'ordre des appels
function mockApi(...reponses) {
  const fetchMock = vi.fn()
  reponses.forEach(([status, body]) => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(body), { status })
    )
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function afficher(element, userId) {
  return render(
    <ProfilContext.Provider value={{ userId, user: null, users: [] }}>
      {element}
    </ProfilContext.Provider>
  )
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('outil abîmé · fiche', () => {
  it('affiche le signalement et son commentaire', async () => {
    mockApi([200, marteauAbime])
    afficher(<Fiche outilId="2" onRetour={() => {}} />, '1')

    expect(
      await screen.findByText('Signalé abîmé : Manche fendu')
    ).toBeTruthy()
    expect(screen.getByText('Indisponible')).toBeTruthy()
    expect(screen.queryByText("Demander l'emprunt")).toBeNull()
  })

  it("n'affiche rien pour un outil en bon état", async () => {
    mockApi([200, marteau])
    afficher(<Fiche outilId="2" onRetour={() => {}} />, '1')

    await screen.findByText('Disponible')
    expect(screen.queryByText(/abîmé/i)).toBeNull()
  })

  it('le bouton Signaler abîmé est réservé au propriétaire', async () => {
    mockApi([200, marteau])
    afficher(<Fiche outilId="2" onRetour={() => {}} />, '1')

    await screen.findByText('Disponible')
    expect(screen.queryByText('Signaler abîmé')).toBeNull()
  })

  it('le propriétaire signale son outil : la fiche se met à jour', async () => {
    const fetchMock = mockApi([200, marteau], [200, marteauAbime])
    afficher(<Fiche outilId="2" onRetour={() => {}} />, '2')

    fireEvent.click(await screen.findByText('Signaler abîmé'))
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Manche fendu' },
    })
    fireEvent.click(screen.getByText('Confirmer le signalement'))

    expect(
      await screen.findByText('Signalé abîmé : Manche fendu')
    ).toBeTruthy()
    expect(screen.getByText('Indisponible')).toBeTruthy()
    // le proprietaire reste affiche apres la mise a jour
    expect(screen.getByText('Proposé par Paul · Gare')).toBeTruthy()

    const [url, options] = fetchMock.mock.calls[1]
    expect(url).toBe('/api/tools/2/damage')
    expect(options.method).toBe('POST')
    expect(options.headers['X-User-Id']).toBe('2')
    expect(JSON.parse(options.body)).toEqual({ comment: 'Manche fendu' })
  })

  it("affiche l'erreur renvoyée par l'api", async () => {
    mockApi(
      [200, marteau],
      [409, { error: 'Outil déjà signalé indisponible' }]
    )
    afficher(<Fiche outilId="2" onRetour={() => {}} />, '2')

    fireEvent.click(await screen.findByText('Signaler abîmé'))
    fireEvent.click(screen.getByText('Confirmer le signalement'))

    expect(
      await screen.findByText('Outil déjà signalé indisponible')
    ).toBeTruthy()
  })
})

describe('outil abîmé · catalogue', () => {
  it('marque les outils abîmés', async () => {
    mockApi([200, [marteau, { ...marteauAbime, id: '9', name: 'Pelle' }]])
    afficher(<Catalogue onChoisir={() => {}} onRetour={() => {}} />, '1')

    await screen.findByText('Pelle')
    expect(screen.getAllByText('Abîmé')).toHaveLength(1)
  })
})
