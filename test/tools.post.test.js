import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import { createApp } from '../src/app.js';

describe('POST /api/tools (US-02 proposer un outil)', () => {
  let app;

  beforeEach(() => {
    app = createApp();
  });

  const post = (body, userId = '1') => {
    const req = request(app).post('/api/tools');
    if (userId !== null) req.set('X-User-Id', userId);
    return req.send(body);
  };

  describe('cas nominal', () => {
    it('crée l\'outil et renvoie 201 avec l\'outil créé', async () => {
      const res = await post({ name: 'Perceuse', category: 'Bricolage', description: 'Bosch 18V' });

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        name: 'Perceuse',
        category: 'Bricolage',
        description: 'Bosch 18V',
        ownerId: '1',
      });
      expect(typeof res.body.id).toBe('string');
      expect(typeof res.body.createdAt).toBe('string');
    });

    it('l\'outil créé apparaît dans GET /api/tools', async () => {
      const created = await post({ name: 'Scie', category: 'Bricolage' });
      const list = await request(app).get('/api/tools');

      expect(list.status).toBe(200);
      expect(list.body).toContainEqual(created.body);
    });

    it('trime le nom, la catégorie et la description', async () => {
      const res = await post({ name: '  Ponceuse  ', category: ' Bricolage ', description: '  Peu servi \n' });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Ponceuse');
      expect(res.body.category).toBe('Bricolage');
      expect(res.body.description).toBe('Peu servi');
    });

    it('stocke "" quand la description est absente', async () => {
      const res = await post({ name: 'Marteau', category: 'Bricolage' });

      expect(res.status).toBe(201);
      expect(res.body.description).toBe('');
    });

    it('autorise les noms en double', async () => {
      const a = await post({ name: 'Tondeuse', category: 'Jardin' });
      const b = await post({ name: 'Tondeuse', category: 'Jardin' }, '2');

      expect(a.status).toBe(201);
      expect(b.status).toBe(201);
      expect(a.body.id).not.toBe(b.body.id);
    });

    it('associe l\'outil au propriétaire indiqué par X-User-Id', async () => {
      const res = await post({ name: 'Échelle', category: 'Bricolage' }, '3');
      expect(res.body.ownerId).toBe('3');
    });
  });

  describe('401 sans utilisateur', () => {
    it('renvoie 401 sans en-tête X-User-Id', async () => {
      const res = await post({ name: 'Perceuse', category: 'Bricolage' }, null);
      expect(res.status).toBe(401);
    });

    it('renvoie 401 avec un X-User-Id vide', async () => {
      const res = await post({ name: 'Perceuse', category: 'Bricolage' }, '   ');
      expect(res.status).toBe(401);
    });

    it('ne crée rien en cas de 401', async () => {
      await post({ name: 'Perceuse', category: 'Bricolage' }, null);
      const list = await request(app).get('/api/tools');
      expect(list.body).toEqual([]);
    });
  });

  describe('400 validation', () => {
    it.each([
      ['absent', { category: 'Bricolage' }],
      ['un nombre', { name: 42, category: 'Bricolage' }],
      ['null', { name: null, category: 'Bricolage' }],
      ['un tableau', { name: ['Perceuse'], category: 'Bricolage' }],
      ['vide', { name: '', category: 'Bricolage' }],
      ['composé d\'espaces', { name: '    ', category: 'Bricolage' }],
    ])('nom %s → 400 field name', async (_label, body) => {
      const res = await post(body);
      expect(res.status).toBe(400);
      expect(res.body.field).toBe('name');
      expect(typeof res.body.error).toBe('string');
    });

    it.each([
      ['absente', { name: 'Perceuse' }],
      ['un nombre', { name: 'Perceuse', category: 3 }],
      ['vide après trim', { name: 'Perceuse', category: '  ' }],
    ])('catégorie %s → 400 field category', async (_label, body) => {
      const res = await post(body);
      expect(res.status).toBe(400);
      expect(res.body.field).toBe('category');
    });

    it('description non chaîne → 400 field description', async () => {
      const res = await post({ name: 'Perceuse', category: 'Bricolage', description: 12 });
      expect(res.status).toBe(400);
      expect(res.body.field).toBe('description');
    });

    it('JSON mal formé → 400', async () => {
      const res = await request(app)
        .post('/api/tools')
        .set('X-User-Id', '1')
        .set('Content-Type', 'application/json')
        .send('{"name": ');
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('ne crée rien en cas de 400', async () => {
      await post({ name: '   ', category: 'Bricolage' });
      const list = await request(app).get('/api/tools');
      expect(list.body).toEqual([]);
    });
  });
});
