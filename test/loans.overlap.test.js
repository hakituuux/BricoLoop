import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import { createApp } from '../src/app.js';
import { loans, tools } from '../src/data.js';
import { seChevauchent } from '../src/overlap.js';

// outil 2 (Marteau) appartient a Paul (id 2)
// Pierre (id 1) a un pret accepte du 10 au 15 ; Jacque (id 3) fait une demande
const marteau = tools.find((t) => t.id === '2');

function pretAccepteDu10Au15() {
  loans.length = 0;
  loans.push({
    id: '1',
    toolId: '2',
    borrowerId: '1',
    startDate: '2026-11-10',
    endDate: '2026-11-15',
    status: 'accepted',
  });
  marteau.status = 'lent';
}

function demander(startDate, endDate, { userId = '3', toolId = '2' } = {}) {
  const req = request(createApp()).post('/api/loans');
  if (userId !== null) req.set('X-User-Id', userId);
  return req.send({ toolId, startDate, endDate });
}

describe('US-06 · empêcher les emprunts qui se chevauchent', () => {
  beforeEach(() => pretAccepteDu10Au15());

  describe('critères d\'acceptation', () => {
    it('prêt accepté du 10 au 15, demande du 12 au 14 → 409', async () => {
      const res = await demander('2026-11-12', '2026-11-14');

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Outil déjà prêté sur ces dates');
      expect(loans).toHaveLength(1);
    });

    it('demande qui commence le lendemain de la fin (le 16) → acceptable (201)', async () => {
      const res = await demander('2026-11-16', '2026-11-18');

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        toolId: '2',
        borrowerId: '3',
        startDate: '2026-11-16',
        endDate: '2026-11-18',
        status: 'pending',
      });
      expect(loans).toHaveLength(2);
    });
  });

  describe('autres chevauchements → 409', () => {
    it.each([
      ['commence le jour de la fin', '2026-11-15', '2026-11-20'],
      ['finit le jour du début', '2026-11-05', '2026-11-10'],
      ['englobe tout le prêt', '2026-11-08', '2026-11-20'],
      ['mêmes dates', '2026-11-10', '2026-11-15'],
      ['à cheval sur le début', '2026-11-08', '2026-11-11'],
      ['un seul jour au milieu', '2026-11-13', '2026-11-13'],
    ])('%s', async (_label, start, end) => {
      const res = await demander(start, end);
      expect(res.status).toBe(409);
    });
  });

  describe('pas de chevauchement → 201', () => {
    it('demande qui finit la veille du début (le 9)', async () => {
      const res = await demander('2026-11-05', '2026-11-09');
      expect(res.status).toBe(201);
    });

    it.each(['pending', 'refused', 'returned'])(
      'un prêt %s ne bloque pas les dates',
      async (status) => {
        loans[0].status = status;
        const res = await demander('2026-11-12', '2026-11-14');
        expect(res.status).toBe(201);
      }
    );

    it('un prêt accepté sur un autre outil ne bloque pas', async () => {
      loans[0].toolId = '6';
      const res = await demander('2026-11-12', '2026-11-14');
      expect(res.status).toBe(201);
    });
  });

  describe('acceptation : deux prêts acceptés ne se chevauchent jamais', () => {
    it('deux demandes en attente qui se chevauchent : la 2e ne peut plus être acceptée', async () => {
      loans.length = 0;
      marteau.status = 'available';
      const a = await demander('2026-11-10', '2026-11-15', { userId: '1' });
      const b = await demander('2026-11-12', '2026-11-14', { userId: '3' });
      expect(a.status).toBe(201);
      expect(b.status).toBe(201);

      const app = createApp();
      const accepteA = await request(app)
        .post(`/api/loans/${a.body.id}/accept`)
        .set('X-User-Id', '2');
      const accepteB = await request(app)
        .post(`/api/loans/${b.body.id}/accept`)
        .set('X-User-Id', '2');

      expect(accepteA.status).toBe(200);
      expect(accepteB.status).toBe(409);
      expect(loans.filter((l) => l.status === 'accepted')).toHaveLength(1);
    });
  });

  describe('POST /api/loans · validation', () => {
    it('401 sans X-User-Id', async () => {
      const res = await demander('2026-11-20', '2026-11-22', { userId: null });
      expect(res.status).toBe(401);
    });

    it('401 si le profil est inconnu', async () => {
      const res = await demander('2026-11-20', '2026-11-22', { userId: '999' });
      expect(res.status).toBe(401);
    });

    it('404 si l\'outil n\'existe pas', async () => {
      const res = await demander('2026-11-20', '2026-11-22', { toolId: 'inconnu' });
      expect(res.status).toBe(404);
    });

    it('400 si on demande son propre outil', async () => {
      const res = await demander('2026-11-20', '2026-11-22', { userId: '2' });
      expect(res.status).toBe(400);
      expect(res.body.field).toBe('toolId');
    });

    it('400 si la date de fin est avant la date de début', async () => {
      const res = await demander('2026-11-22', '2026-11-20');
      expect(res.status).toBe(400);
      expect(res.body.field).toBe('endDate');
    });

    it.each([
      ['startDate', 'demain', '2026-11-22'],
      ['startDate', '2026-02-30', '2026-11-22'],
      ['endDate', '2026-11-20', undefined],
    ])('400 si %s est invalide', async (field, start, end) => {
      const res = await demander(start, end);
      expect(res.status).toBe(400);
      expect(res.body.field).toBe(field);
    });

    it('400 si toolId est absent', async () => {
      const res = await request(createApp())
        .post('/api/loans')
        .set('X-User-Id', '3')
        .send({ startDate: '2026-11-20', endDate: '2026-11-22' });
      expect(res.status).toBe(400);
      expect(res.body.field).toBe('toolId');
    });

    it('409 si l\'outil est signalé indisponible', async () => {
      marteau.status = 'unavailable';
      const res = await demander('2026-11-20', '2026-11-22');
      expect(res.status).toBe(409);
    });
  });
});

describe('seChevauchent (bornes incluses)', () => {
  const pret = { startDate: '2026-11-10', endDate: '2026-11-15' };

  it.each([
    ['2026-11-12', '2026-11-14', true],
    ['2026-11-15', '2026-11-16', true],
    ['2026-11-09', '2026-11-10', true],
    ['2026-11-16', '2026-11-20', false],
    ['2026-11-01', '2026-11-09', false],
  ])('%s → %s : %s', (startDate, endDate, attendu) => {
    expect(seChevauchent(pret, { startDate, endDate })).toBe(attendu);
    expect(seChevauchent({ startDate, endDate }, pret)).toBe(attendu);
  });
});
