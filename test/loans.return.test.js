import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import { createApp } from '../src/app.js';
import { loans, tools } from '../src/data.js';

// outil 2 (Marteau) appartient a Paul (id 2), emprunte par Pierre (id 1)
const marteau = tools.find((t) => t.id === '2');

function preparerPret(status) {
  loans.length = 0;
  loans.push({ id: 'test', toolId: '2', borrowerId: '1', status });
  marteau.status = status === 'accepted' ? 'lent' : 'available';
}

function declarerRetour(userId, loanId = 'test') {
  const req = request(createApp()).post(`/api/loans/${loanId}/return`);
  return userId ? req.set('X-User-Id', userId) : req;
}

describe('POST /api/loans/:id/return', () => {
  beforeEach(() => preparerPret('accepted'));

  it('le propriétaire déclare le retour : prêt rendu et outil disponible', async () => {
    const res = await declarerRetour('2');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('returned');
    expect(res.body.tool.status).toBe('available');
    expect(loans[0].status).toBe('returned');
    expect(marteau.status).toBe('available');
  });

  it('l\'outil rendu réapparaît comme disponible dans le catalogue', async () => {
    await declarerRetour('2');
    const res = await request(createApp()).get('/api/tools/2');
    expect(res.body.status).toBe('available');
  });

  it('retourne 403 si ce n\'est pas le propriétaire (ex : l\'emprunteur)', async () => {
    const res = await declarerRetour('1');
    expect(res.status).toBe(403);
    expect(loans[0].status).toBe('accepted');
    expect(marteau.status).toBe('lent');
  });

  it('retourne 403 sans en-tête X-User-Id', async () => {
    const res = await declarerRetour(null);
    expect(res.status).toBe(403);
  });

  it('retourne 404 si le prêt n\'existe pas', async () => {
    const res = await declarerRetour('2', 'inconnu');
    expect(res.status).toBe(404);
  });

  it.each(['pending', 'refused', 'returned'])(
    'retourne 409 si le prêt est %s',
    async (status) => {
      preparerPret(status);
      const res = await declarerRetour('2');
      expect(res.status).toBe(409);
      expect(loans[0].status).toBe(status);
    }
  );
});
