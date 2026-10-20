// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import MesEmprunts from '../src/components/MesEmprunts.jsx'

// remplace fetch par une fausse reponse de l'api
function mockApi(status, body) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), { status })
  )
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

// demandes de Pierre, deja triees par date de debut comme le renvoie l'api
const demandesPierre = [
  {
    id: '2',
    toolId: '3',
    borrowerId: '1',
    startDate: '2026-10-25',
    endDate: '2026-10-27',
    status: 'pending',
    toolName: 'Pelle',
  },
  {
    id: '4',
    toolId: '2',
    borrowerId: '1',
    startDate: '2026-11-01',
    endDate: '2026-11-04',
    status: 'refused',
    toolName: 'Marteau',
  },
  {
    id: '1',
    toolId: '6',
    borrowerId: '1',
    startDate: '2026-11-10',
    endDate: '2026-11-15',
    status: 'accepted',
    toolName: 'Tondeuse',
  },
]

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('US-08 · voir mes emprunts', () => {
  it('appelle GET /api/loans/mine avec X-User-Id', async () => {
    const fetchMock = mockApi(200, demandesPierre)
    render(<MesEmprunts userId="1" />)

    await screen.findByText('Pelle')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, options] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/loans/mine')
    expect(options.headers['X-User-Id']).toBe('1')
  })

  it('affiche mes demandes avec leur statut, triees par date de debut', async () => {
    mockApi(200, demandesPierre)
    render(<MesEmprunts userId="1" />)

    await screen.findByText('Pelle')
    const lignes = screen.getAllByRole('row').slice(1)
    expect(lignes.map((l) => l.textContent)).toEqual([
      'Pelle25/10/202627/10/2026En attente',
      'Marteau01/11/202604/11/2026Refusée',
      'Tondeuse10/11/202615/11/2026Acceptée',
    ])
  })

  it('affiche un message si je n ai aucune demande', async () => {
    mockApi(200, [])
    render(<MesEmprunts userId="4" />)

    expect(
      await screen.findByText("Vous n'avez aucune demande pour le moment.")
    ).toBeTruthy()
  })

  it('affiche le message d erreur de l api', async () => {
    mockApi(401, { error: 'Choisissez un profil (en-tete X-User-Id)' })
    render(<MesEmprunts userId="999" />)

    expect((await screen.findByRole('alert')).textContent).toBe(
      'Choisissez un profil (en-tete X-User-Id)'
    )
  })

  it('sans profil, n appelle pas l api', () => {
    const fetchMock = mockApi(200, [])
    render(<MesEmprunts userId="" />)

    expect(
      screen.getByText('Choisissez votre profil pour voir vos emprunts.')
    ).toBeTruthy()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
