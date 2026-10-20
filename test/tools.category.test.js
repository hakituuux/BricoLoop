import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { createApp } from '../src/app.js';
import { tools } from '../src/data.js';

function catalogue(query) {
  return request(createApp()).get('/api/tools').query(query);
}

describe('GET /api/tools?category=', () => {
  it('ne renvoie que les outils de la catégorie choisie', async () => {
    const res = await catalogue({ category: 'Perçage' });
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(
      tools.filter((t) => t.category === 'Perçage').length
    );
    expect(res.body.length).toBeGreaterThan(0);
    res.body.forEach((t) => expect(t.category).toBe('Perçage'));
  });

  it('renvoie une liste vide pour une catégorie connue sans outil', async () => {
    const res = await catalogue({ category: 'Mesure' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('sans filtre, renvoie tout le catalogue', async () => {
    const res = await catalogue({});
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(tools.length);
  });

  it('retourne 400 pour une catégorie inconnue', async () => {
    const res = await catalogue({ category: 'Cuisine' });
    expect(res.status).toBe(400);
    expect(res.body.field).toBe('category');
  });

  it('retourne 400 pour une catégorie vide', async () => {
    const res = await catalogue({ category: '' });
    expect(res.status).toBe(400);
  });

  it('retourne 400 si la catégorie est passée plusieurs fois', async () => {
    const res = await request(createApp()).get(
      '/api/tools?category=Peinture&category=Jardinage'
    );
    expect(res.status).toBe(400);
  });
});
