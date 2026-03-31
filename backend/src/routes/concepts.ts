import { Router, type Request, type Response } from 'express';
import type { Concept, Attempt } from '../types/index.js';

const router = Router();

/**
 * GET /api/concepts — list all concepts with attempt counts
 */
router.get('/', (_req: Request, res: Response) => {
  void _req;
  res.status(501).json({ error: 'Not implemented' });
});

/**
 * GET /api/concepts/:id/attempts — attempts for a concept (before /:id)
 */
router.get('/:id/attempts', (req: Request<{ id: string }>, res: Response) => {
  void req.params.id;
  const _future: Attempt[] = [];
  void _future;
  res.status(501).json({ error: 'Not implemented' });
});

/**
 * GET /api/concepts/:id — single concept
 */
router.get('/:id', (req: Request<{ id: string }>, res: Response) => {
  void req.params.id;
  const _future: Concept | null = null;
  void _future;
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
