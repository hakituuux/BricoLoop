import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { createApp } from '../src/app.js';

describe('GET /api/tools', () => {
  it('retourne la liste des outils', async () => {
    const res = await request(createApp()).get('/api/tools');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('GET /api/tools/:id', () => {
  it('retourne l\'outil demandé', async () => {
    const res = await request(createApp()).get('/api/tools/1');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('1');
    expect(res.body.owner.firstName).toBeDefined();
  });

  it('retourne 404 si l\'outil n\'existe pas', async () => {
    const res = await request(createApp()).get('/api/tools/inconnu');
    expect(res.status).toBe(404);
  });
});
