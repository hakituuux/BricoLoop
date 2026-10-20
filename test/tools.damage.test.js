import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import { createApp } from '../src/app.js';
import { tools } from '../src/data.js';

// outil 2 (Marteau) appartient a Paul (id 2)
const marteau = tools.find((t) => t.id === '2');

function signaler(userId, body, toolId = '2') {
  let req = request(createApp()).post(`/api/tools/${toolId}/damage`);
  if (userId) {
    req = req.set('X-User-Id', userId);
  }
  return req.send(body);
}

describe('POST /api/tools/:id/damage', () => {
  beforeEach(() => {
    marteau.status = 'available';
    delete marteau.damage;
  });

  it('le propriétaire signale son outil abîmé : il devient indisponible', async () => {
    const res = await signaler('2', { comment: '  Manche fendu  ' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('unavailable');
    expect(res.body.damage.comment).toBe('Manche fendu');
    expect(res.body.damage.reportedAt).toBeDefined();
    expect(marteau.status).toBe('unavailable');
  });

  it('le commentaire est optionnel', async () => {
    const res = await signaler('2');
    expect(res.status).toBe(200);
    expect(res.body.damage.comment).toBe('');
  });

  it('la fiche outil affiche le signalement', async () => {
    await signaler('2', { comment: 'Tête qui bouge' });
    const res = await request(createApp()).get('/api/tools/2');
    expect(res.body.status).toBe('unavailable');
    expect(res.body.damage.comment).toBe('Tête qui bouge');
  });

  it('retourne 403 si ce n\'est pas le propriétaire', async () => {
    const res = await signaler('1', { comment: 'Cassé' });
    expect(res.status).toBe(403);
    expect(marteau.status).toBe('available');
  });

  it('retourne 403 sans en-tête X-User-Id', async () => {
    const res = await signaler(null);
    expect(res.status).toBe(403);
  });

  it('retourne 404 si l\'outil n\'existe pas', async () => {
    const res = await signaler('2', {}, 'inconnu');
    expect(res.status).toBe(404);
  });

  it.each([42, 'x'.repeat(301)])('retourne 400 si le commentaire est invalide (%#)', async (comment) => {
    const res = await signaler('2', { comment });
    expect(res.status).toBe(400);
    expect(res.body.field).toBe('comment');
    expect(marteau.status).toBe('available');
  });

  it('retourne 409 si l\'outil est actuellement prêté', async () => {
    marteau.status = 'lent';
    const res = await signaler('2');
    expect(res.status).toBe(409);
    expect(marteau.status).toBe('lent');
  });

  it('retourne 409 si l\'outil est déjà indisponible', async () => {
    await signaler('2');
    const res = await signaler('2');
    expect(res.status).toBe(409);
  });
});
