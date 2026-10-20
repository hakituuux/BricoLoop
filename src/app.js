import express from 'express';

// données en dur pour l'instant (les ids des propriétaires sont ceux des voisins du front)
const tools = [
  {
    id: '1',
    name: 'Perceuse sans fil',
    category: 'Perçage',
    description: 'Perceuse 18V avec deux batteries.',
    status: 'available',
    owner: { id: '1', firstName: 'Lea', district: 'Belleville' },
  },
  {
    id: '2',
    name: 'Scie sauteuse',
    category: 'Sciage',
    description: null,
    status: 'borrowed',
    owner: { id: '2', firstName: 'Karim', district: 'Croix-Rousse' },
  },
];

export function createApp() {
  const app = express();

  app.use(express.json());

  app.get('/api/tools', (_req, res) => {
    res.json(tools);
  });

  app.get('/api/tools/:id', (req, res) => {
    const tool = tools.find((t) => t.id === req.params.id);

    if (!tool) {
      return res.status(404).json({ error: 'Outil introuvable' });
    }

    res.json(tool);
  });

  return app;
}
