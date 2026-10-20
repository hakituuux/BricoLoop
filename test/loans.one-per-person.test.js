import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import { createApp } from '../src/app.js';
import { loans, tools } from '../src/data.js';

// Decision du PO (US-06) : une personne qui a deja un outil emprunte
// ne peut pas en reserver un autre, meme s'il est disponible.
// Jacque (id 3) emprunte le marteau de Paul (outil 2).
// Outil 1 (Tournevis) et outil 8 (Hache) : d'autres proprietaires.

function reinitialiser() {
  loans.length = 0;
  for (const t of tools) t.status = 'available';
}

function pret(id, toolId, borrowerId, status) {
  return {
    id,
    toolId,
    borrowerId,
    startDate: '2026-11-10',
    endDate: '2026-11-15',
    status,
  };
}

function demander(userId, toolId, startDate = '2026-12-01', endDate = '2026-12-03') {
  return request(createApp())
    .post('/api/loans')
    .set('X-User-Id', userId)
    .send({ toolId, startDate, endDate });
}

function accepter(loanId, ownerId) {
  return request(createApp())
    .post(`/api/loans/${loanId}/accept`)
    .set('X-User-Id', ownerId);
}

describe('US-06 · un seul outil emprunté à la fois par personne', () => {
  beforeEach(reinitialiser);

  describe('POST /api/loans', () => {
    it('409 si la personne a déjà un prêt accepté, même sur un autre outil disponible', async () => {
      loans.push(pret('1', '2', '3', 'accepted'));
      const res = await demander('3', '8');

      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/déjà un outil emprunté/);
      expect(loans).toHaveLength(1);
    });

    it('409 même si les dates ne se chevauchent pas', async () => {
      loans.push(pret('1', '2', '3', 'accepted'));
      const res = await demander('3', '8', '2027-01-10', '2027-01-12');
      expect(res.status).toBe(409);
    });

    it('après le retour de l\'outil, la personne peut réserver à nouveau', async () => {
      loans.push(pret('1', '2', '3', 'accepted'));
      const retour = await request(createApp())
        .post('/api/loans/1/return')
        .set('X-User-Id', '2');
      expect(retour.status).toBe(200);

      const res = await demander('3', '8');
      expect(res.status).toBe(201);
    });

    it.each(['pending', 'refused', 'returned'])(
      'un prêt %s ne bloque pas une nouvelle demande',
      async (status) => {
        loans.push(pret('1', '2', '3', status));
        const res = await demander('3', '8');
        expect(res.status).toBe(201);
      }
    );

    it('le prêt d\'un autre voisin ne bloque pas', async () => {
      loans.push(pret('1', '2', '1', 'accepted'));
      const res = await demander('3', '8');
      expect(res.status).toBe(201);
    });

    it('prêter ses propres outils ne bloque pas (Paul prête son marteau)', async () => {
      loans.push(pret('1', '2', '3', 'accepted'));
      const res = await demander('2', '8');
      expect(res.status).toBe(201);
    });
  });

  describe('POST /api/loans/:id/accept', () => {
    it('deux demandes en attente de la même personne : une seule peut être acceptée', async () => {
      const a = await demander('3', '2');
      const b = await demander('3', '8');
      expect(a.status).toBe(201);
      expect(b.status).toBe(201);

      const accepteA = await accepter(a.body.id, '2');
      const accepteB = await accepter(b.body.id, '4');

      expect(accepteA.status).toBe(200);
      expect(accepteB.status).toBe(409);
      expect(accepteB.body.error).toMatch(/déjà un outil emprunté/);
      expect(loans.find((l) => l.id === b.body.id).status).toBe('pending');
    });

    it('le refus reste possible quand l\'emprunteur a déjà un outil', async () => {
      loans.push(pret('1', '2', '3', 'accepted'), pret('2', '8', '3', 'pending'));
      const res = await request(createApp())
        .post('/api/loans/2/refuse')
        .set('X-User-Id', '4');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('refused');
    });
  });
});
