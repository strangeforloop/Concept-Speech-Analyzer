import 'dotenv/config';
import express, { type Express } from 'express';
import conceptsRouter from './routes/concepts.js';
import attemptsRouter from './routes/attempts.js';

const PORT = Number(process.env.PORT) || 3000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

export function createApp(): Express {
  const app = express();

  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', FRONTEND_ORIGIN);
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }

    next();
  });

  app.use(express.json({ limit: '50mb' }));

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
