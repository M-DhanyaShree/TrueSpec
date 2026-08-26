import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import laptopRoutes from './routes/laptopRoutes';

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'TrueSpec Express Backend' });
  });

  // Laptop and recommendation routes
  app.use('/api/laptops', laptopRoutes);

  // Stats alias
  app.use('/api', laptopRoutes);

  // Static serving of frontend build in production
  const frontendDist = path.resolve(__dirname, '../../frontend/dist');
  if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.get('*', (req: Request, res: Response, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
  }

  return app;
}

export default createApp;
