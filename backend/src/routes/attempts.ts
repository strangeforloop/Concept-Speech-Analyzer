import { Router, type Request, type Response } from 'express';
import type { CreateAttemptBody, CreateAttemptResponse } from '../types/index.js';

const router = Router();

/**
 * POST /api/attempts — submit audio; transcribe, analyze, persist (TBD)
 */
router.post('/', (req: Request<object, CreateAttemptResponse | { error: string }, CreateAttemptBody>, res: Response) => {
  void req.body;
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
