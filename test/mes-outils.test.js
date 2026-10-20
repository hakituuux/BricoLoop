import request from 'supertest'
import { describe, it, expect } from 'vitest'
import { createApp } from '../src/app.js'

describe('GET /api/mes-outils', () => {
  it('liste mes outils avec le nombre de demandes en attente', async () => {
    const res = await request(createApp())
      .get('/api/mes-outils')
      .set('X-User-Id', '3')

    expect(res.status).toBe(200)
    expect(res.body.length).toBe(2)

    const pelle = res.body.find((o) => o.id === '3')
    const tronconneuse = res.body.find((o) => o.id === '7')
    expect(pelle.pendingCount).toBe(1)
    expect(tronconneuse.pendingCount).toBe(0)
    expect(res.body.find((o) => o.id === '1')).toBeUndefined()
  })

  it('ne compte pas une demande refusee', async () => {
    const res = await request(createApp())
      .get('/api/mes-outils')
      .set('X-User-Id', '2')

    const marteau = res.body.find((o) => o.id === '2')
    expect(marteau.pendingCount).toBe(0)
  })

  it('renvoie 401 sans profil', async () => {
    const res = await request(createApp()).get('/api/mes-outils')
    expect(res.status).toBe(401)
  })
})
