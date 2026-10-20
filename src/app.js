import express from 'express';
import { createToolsRouter } from './routes/tools.js';

// Crée l'application Express. Chaque appel a son propre stockage en mémoire,
// ce qui garde les tests indépendants les uns des autres.
export function createApp() {
  const app = express();
  app.use(express.json());

  const store = { tools: [], nextId: 1 };
  app.use('/api/tools', createToolsRouter(store));

  // JSON mal formé → 400 plutôt qu'une page d'erreur HTML
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Corps de requête JSON invalide', field: 'body' });
    }
    return next(err);
  });

  return app;
}
