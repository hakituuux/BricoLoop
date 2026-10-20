import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { createApp } from '../src/app.js';

describe('GET /api/loans/mine (US-08)', () => {
  it('retourne mes demandes avec statut et nom de l\'outil, triees par date de debut', async () => {
    const res = await request(createApp())
      .get('/api/loans/mine')
      .set('X-User-Id', '1');

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(1);

    const dates = res.body.map((l) => l.startDate);
    expect(dates).toEqual([...dates].sort());

    for (const loan of res.body) {
      expect(loan.status).toBeDefined();
      expect(loan.toolName).toBeTruthy();
    }
  });

  it('ne retourne que les demandes de l\'utilisateur', async () => {
    const res = await request(createApp())
      .get('/api/loans/mine')
      .set('X-User-Id', '2');

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    for (const loan of res.body) {
      expect(loan.borrowerId).toBe('2');
    }
  });

  it('retourne 401 sans X-User-Id', async () => {
    const res = await request(createApp()).get('/api/loans/mine');
    expect(res.status).toBe(401);
  });

  it('retourne 401 si le profil est inconnu', async () => {
    const res = await request(createApp())
      .get('/api/loans/mine')
      .set('X-User-Id', '999');
    expect(res.status).toBe(401);
  });
});
