import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import { createApp } from '../src/app.js';
import { loans } from '../src/data.js';

// outil 2 (Marteau) appartient a Paul (id 2), emprunte par Pierre (id 1)
function preparerPret(status) {
  loans.length = 0;
  loans.push({ id: 'test', toolId: '2', borrowerId: '1', status });
}

function noter(userId, body = { rating: 4 }, loanId = 'test') {
  const req = request(createApp()).post(`/api/loans/${loanId}/rating`).send(body);
  return userId ? req.set('X-User-Id', userId) : req;
}

describe('US-13 · noter l\'emprunteur après le retour', () => {
  beforeEach(() => preparerPret('returned'));

  it('le propriétaire note l\'emprunteur sur un prêt rendu', async () => {
    const res = await noter('2', { rating: 5 });
    expect(res.status).toBe(200);
    expect(res.body.rating).toBe(5);
    expect(loans[0].rating).toBe(5);
  });

  it.each([1, 3, 5])('accepte la note %i', async (rating) => {
    const res = await noter('2', { rating });
    expect(res.status).toBe(200);
  });

  it.each([0, 6, -1, 3.5, '4', null, undefined])(
    'retourne 400 si la note est %s',
    async (rating) => {
      const res = await noter('2', { rating });
      expect(res.status).toBe(400);
      expect(res.body.field).toBe('rating');
      expect(loans[0].rating).toBeUndefined();
    }
  );

  it('retourne 400 sans corps de requête', async () => {
    const res = await request(createApp())
      .post('/api/loans/test/rating')
      .set('X-User-Id', '2');
    expect(res.status).toBe(400);
  });

  it('retourne 409 si le prêt est déjà noté, la première note est conservée', async () => {
    await noter('2', { rating: 5 });
    const res = await noter('2', { rating: 1 });
    expect(res.status).toBe(409);
    expect(loans[0].rating).toBe(5);
  });

  it.each(['pending', 'accepted', 'refused'])(
    'retourne 409 si le prêt est %s (pas rendu)',
    async (status) => {
      preparerPret(status);
      const res = await noter('2');
      expect(res.status).toBe(409);
      expect(loans[0].rating).toBeUndefined();
    }
  );

  it('retourne 403 si ce n\'est pas le propriétaire (ex : l\'emprunteur)', async () => {
    const res = await noter('1');
    expect(res.status).toBe(403);
    expect(loans[0].rating).toBeUndefined();
  });

  it('retourne 403 sans en-tête X-User-Id', async () => {
    const res = await noter(null);
    expect(res.status).toBe(403);
  });

  it('retourne 404 si le prêt n\'existe pas', async () => {
    const res = await noter('2', { rating: 4 }, 'inconnu');
    expect(res.status).toBe(404);
  });
});
