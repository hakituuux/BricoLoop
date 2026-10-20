import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import { createApp } from '../src/app.js';
import { loans } from '../src/data.js';

// outil 2 (Marteau) appartient a Paul (id 2)
function pret(id, borrowerId, startDate, endDate, status, toolId = '2') {
  return { id, toolId, borrowerId, startDate, endDate, status };
}

function historique(userId, toolId = '2') {
  const req = request(createApp()).get(`/api/tools/${toolId}/history`);
  return userId === null ? req : req.set('X-User-Id', userId);
}

describe('GET /api/tools/:id/history (US-14)', () => {
  beforeEach(() => {
    loans.length = 0;
    loans.push(
      pret('a', '1', '2026-09-01', '2026-09-03', 'returned'),
      pret('b', '3', '2026-11-10', '2026-11-12', 'accepted'),
      pret('c', '4', '2026-10-05', '2026-10-06', 'returned'),
      pret('d', '1', '2026-12-01', '2026-12-02', 'pending'),
      pret('e', '3', '2026-10-20', '2026-10-21', 'refused'),
      pret('f', '1', '2026-10-10', '2026-10-11', 'returned', '6') // autre outil
    );
  });

  it('liste les prêts acceptés et rendus, du plus récent au plus ancien', async () => {
    const res = await historique('2');

    expect(res.status).toBe(200);
    expect(res.body.map((l) => l.id)).toEqual(['b', 'c', 'a']);
    expect(res.body.map((l) => l.status)).toEqual(['accepted', 'returned', 'returned']);
  });

  it('exclut les demandes en attente et refusées', async () => {
    const res = await historique('2');
    const statuts = res.body.map((l) => l.status);

    expect(statuts).not.toContain('pending');
    expect(statuts).not.toContain('refused');
  });

  it('ne contient que les prêts de cet outil', async () => {
    const res = await historique('2');
    for (const loan of res.body) {
      expect(loan.toolId).toBe('2');
    }
  });

  it('indique qui a emprunté l\'outil, avec les dates', async () => {
    const res = await historique('2');

    expect(res.body[0]).toMatchObject({
      borrower: { id: '3', firstName: 'Jacque' },
      startDate: '2026-11-10',
      endDate: '2026-11-12',
    });
    expect(res.body[1].borrower.firstName).toBe('FRANSCECO');
    expect(res.body[2].borrower.firstName).toBe('Pierre');
  });

  it('garde la note de l\'emprunteur si le prêt a été noté (US-13)', async () => {
    loans[0].rating = 4;
    const res = await historique('2');
    expect(res.body.find((l) => l.id === 'a').rating).toBe(4);
  });

  it('même date de début : celui qui finit le plus tard d\'abord', async () => {
    loans.push(pret('g', '4', '2026-09-01', '2026-09-05', 'returned'));
    const res = await historique('2');
    expect(res.body.map((l) => l.id)).toEqual(['b', 'c', 'g', 'a']);
  });

  it('renvoie une liste vide si l\'outil n\'a jamais été prêté', async () => {
    loans.length = 0;
    const res = await historique('2');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('403 si ce n\'est pas le propriétaire (ex : un emprunteur)', async () => {
    const res = await historique('1');
    expect(res.status).toBe(403);
    expect(res.body.error).toBeTypeOf('string');
  });

  it('401 sans en-tête X-User-Id', async () => {
    const res = await historique(null);
    expect(res.status).toBe(401);
  });

  it('404 si l\'outil n\'existe pas', async () => {
    const res = await historique('2', 'inconnu');
    expect(res.status).toBe(404);
  });
});
