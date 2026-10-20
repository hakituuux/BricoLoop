import { Router } from 'express';
import { requireUser } from '../middleware/requireUser.js';
import { validateNewTool } from '../validation/tool.js';

export function createToolsRouter(store) {
  const router = Router();

  router.get('/', (req, res) => {
    res.status(200).json(store.tools);
  });

  // US-02 : en tant que propriétaire, je propose un outil à mes voisins
  router.post('/', requireUser, (req, res) => {
    const result = validateNewTool(req.body);
    if (!result.ok) {
      return res.status(400).json({ error: result.error, field: result.field });
    }

    const tool = {
      id: String(store.nextId++),
      ownerId: req.userId,
      ...result.value,
      createdAt: new Date().toISOString(),
    };
    store.tools.push(tool);

    return res.status(201).json(tool);
  });

  return router;
}
