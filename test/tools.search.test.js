import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { createApp } from '../src/app.js';
import { tools } from '../src/data.js';

function rechercher(query) {
  return request(createApp()).get('/api/tools').query(query);
}

function noms(res) {
  return res.body.map((t) => t.name).sort();
}

describe('GET /api/tools?q=', () => {
  it('cherche dans le nom', async () => {
    const res = await rechercher({ q: 'tondeuse' });
    expect(res.status).toBe(200);
    expect(noms(res)).toEqual(['Tondeuse']);
  });

  it('cherche dans la description', async () => {
    const res = await rechercher({ q: 'charpentier' });
    expect(res.status).toBe(200);
    expect(noms(res)).toEqual(['Marteau']);
  });

  it('ne tient pas compte des majuscules', async () => {
    const res = await rechercher({ q: 'TOURNEVIS' });
    expect(noms(res)).toEqual(['Tournevis']);
  });

  it('ne tient pas compte des accents', async () => {
    const res = await rechercher({ q: 'Tronçonneuse' });
    expect(noms(res)).toEqual(['Tronconneuse']);
  });

  it('une recherche sans résultat renvoie une liste vide', async () => {
    const res = await rechercher({ q: 'perceuse-laser' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('un q vide renvoie la liste complète', async () => {
    const res = await rechercher({ q: '   ' });
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(tools.length);
  });

  it('se combine avec la catégorie', async () => {
    const res = await rechercher({ q: 'jardin', category: 'Jardinage' });
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    res.body.forEach((t) => expect(t.category).toBe('Jardinage'));

    const aucun = await rechercher({ q: 'jardin', category: 'Perçage' });
    expect(aucun.body).toEqual([]);
  });

  it('une catégorie inconnue renvoie 400 même avec q', async () => {
    const res = await rechercher({ q: 'pelle', category: 'Cuisine' });
    expect(res.status).toBe(400);
  });

  it('retourne 400 si q est passé plusieurs fois', async () => {
    const res = await request(createApp()).get('/api/tools?q=pelle&q=hache');
    expect(res.status).toBe(400);
    expect(res.body.field).toBe('q');
  });
});
