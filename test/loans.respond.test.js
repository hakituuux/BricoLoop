import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import { createApp } from '../src/app.js';
import { loans, tools } from '../src/data.js';

// outil 2 (Marteau) appartient a Paul (id 2), demande par Pierre (id 1)
const marteau = tools.find((t) => t.id === '2');

function preparerDemande(status = 'pending', toolStatus = 'available') {
  loans.length = 0;
  loans.push({
    id: 'test',
    toolId: '2',
    borrowerId: '1',
    startDate: '2026-11-02',
    endDate: '2026-11-05',
    status,
  });
  marteau.status = toolStatus;
}

function repondre(action, userId, loanId = 'test') {
  const req = request(createApp()).post(`/api/loans/${loanId}/${action}`);
  return userId === null ? req : req.set('X-User-Id', userId);
}

describe('US-05 · accepter ou refuser une demande', () => {
  beforeEach(() => preparerDemande());

  describe('POST /api/loans/:id/accept', () => {
    it('le propriétaire accepte : demande acceptée et outil prêté', async () => {
      const res = await repondre('accept', '2');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('accepted');
      expect(res.body.tool.status).toBe('lent');
      expect(loans[0].status).toBe('accepted');
      expect(marteau.status).toBe('lent');
    });

    it('l\'outil accepté apparaît comme prêté sur sa fiche', async () => {
      await repondre('accept', '2');
      const res = await request(createApp()).get('/api/tools/2');
      expect(res.body.status).toBe('lent');
    });

    // US-06 : le garde-fou porte sur les dates, plus sur le statut de l'outil
    it('409 si un prêt accepté chevauche les dates de la demande', async () => {
      loans.push({
        id: 'autre',
        toolId: '2',
        borrowerId: '3',
        startDate: '2026-11-04',
        endDate: '2026-11-08',
        status: 'accepted',
      });
      const res = await repondre('accept', '2');

      expect(res.status).toBe(409);
      expect(loans[0].status).toBe('pending');
    });

    it('accepte si le prêt accepté se termine la veille de la demande', async () => {
      loans.push({
        id: 'autre',
        toolId: '2',
        borrowerId: '3',
        startDate: '2026-10-28',
        endDate: '2026-11-01',
        status: 'accepted',
      });
      marteau.status = 'lent';
      const res = await repondre('accept', '2');

      expect(res.status).toBe(200);
      expect(loans[0].status).toBe('accepted');
    });
  });

  describe('POST /api/loans/:id/refuse', () => {
    it('le propriétaire refuse : demande refusée et outil inchangé', async () => {
      const res = await repondre('refuse', '2');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('refused');
      expect(res.body.tool.status).toBe('available');
      expect(loans[0].status).toBe('refused');
      expect(marteau.status).toBe('available');
    });

    it('refuser ne touche pas un outil déjà prêté', async () => {
      preparerDemande('pending', 'lent');
      const res = await repondre('refuse', '2');

      expect(res.status).toBe(200);
      expect(marteau.status).toBe('lent');
    });
  });

  describe.each(['accept', 'refuse'])('règles communes (%s)', (action) => {
    it('403 si ce n\'est pas le propriétaire (ex : l\'emprunteur)', async () => {
      const res = await repondre(action, '1');

      expect(res.status).toBe(403);
      expect(res.body.error).toBeTypeOf('string');
      expect(loans[0].status).toBe('pending');
      expect(marteau.status).toBe('available');
    });

    it('403 pour un autre voisin', async () => {
      const res = await repondre(action, '3');
      expect(res.status).toBe(403);
    });

    it('401 sans en-tête X-User-Id', async () => {
      const res = await repondre(action, null);
      expect(res.status).toBe(401);
      expect(loans[0].status).toBe('pending');
    });

    it('404 si la demande n\'existe pas', async () => {
      const res = await repondre(action, '2', 'inconnue');
      expect(res.status).toBe(404);
    });

    it.each(['accepted', 'refused', 'returned'])(
      '409 si la demande est déjà %s',
      async (status) => {
        preparerDemande(status, status === 'accepted' ? 'lent' : 'available');
        const statutOutilAvant = marteau.status;
        const res = await repondre(action, '2');

        expect(res.status).toBe(409);
        expect(loans[0].status).toBe(status);
        expect(marteau.status).toBe(statutOutilAvant);
      }
    );

    it('403 passe avant 409 : un non-propriétaire reçoit 403 même si la demande est traitée', async () => {
      preparerDemande('refused');
      const res = await repondre(action, '1');
      expect(res.status).toBe(403);
    });
  });
});
