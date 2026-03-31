import 'dotenv/config';
import express, { type Express } from 'express';
import conceptsRouter from './routes/concepts.js';
import attemptsRouter from './routes/attempts.js';

const PORT = Number(process.env.PORT) || 3000;

export function createApp(): Express {
  const app = express();

  app.use(express.json({ limit: '25mb' }));

  app.use('/api/concepts', conceptsRouter);
  app.use('/api/attempts', attemptsRouter);

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  return app;
}

const app = createApp();

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

export { app };
