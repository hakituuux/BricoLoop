import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import { createApp } from '../src/app.js';
import { loans, tools } from '../src/data.js';

// l'horloge des tests est figee au 20/10/2026 (voir test/setup.js)
// Pierre (id 1) demande le marteau de Paul (outil 2)

function reinitialiser() {
  loans.length = 0;
  for (const t of tools) t.status = 'available';
}

function demander(startDate, endDate) {
  return request(createApp())
    .post('/api/loans')
    .set('X-User-Id', '1')
    .send({ toolId: '2', startDate, endDate });
}

describe('POST /api/loans · pas de date dans le passé', () => {
  beforeEach(reinitialiser);

  it('400 si la date de début est passée (hier)', async () => {
    const res = await demander('2026-10-19', '2026-10-22');
    expect(res.status).toBe(400);
    expect(res.body.field).toBe('startDate');
    expect(res.body.error).toMatch(/passé/);
    expect(loans).toHaveLength(0);
  });

  it('400 si toute la période est passée', async () => {
    const res = await demander('2026-09-01', '2026-09-03');
    expect(res.status).toBe(400);
    expect(res.body.field).toBe('startDate');
  });

  it('201 si la demande commence aujourd\'hui', async () => {
    const res = await demander('2026-10-20', '2026-10-21');
    expect(res.status).toBe(201);
  });

  it('201 si la demande est dans le futur', async () => {
    const res = await demander('2026-10-25', '2026-10-27');
    expect(res.status).toBe(201);
  });
});
