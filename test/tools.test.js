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
