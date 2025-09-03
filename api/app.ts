/**
 * This is a API server
 */

import express, { type Request, type Response, type NextFunction }  from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import hackingRoutes from './routes/hacking.js';
import storyRoutes from './routes/story.js';
import intelligenceRoutes from './routes/intelligence.js';
import partnersRoutes from './routes/partners.js';
import aiPartnersRoutes from './routes/ai-partners.js';
import campaignsRoutes from './routes/campaigns.js';
import investigationRoutes from './routes/investigation.js';
import systemRoutes from './routes/system.js';

// for esm mode
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// load env
dotenv.config();


const app: express.Application = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * API Routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/hacking', hackingRoutes);
app.use('/api/story', storyRoutes);
app.use('/api/intelligence', intelligenceRoutes);
app.use('/api/partners', partnersRoutes);
app.use('/api/ai-partners', aiPartnersRoutes);
app.use('/api/ai-personality', aiPartnersRoutes); // Alias for ai-partners
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/investigation', investigationRoutes);
app.use('/api/system', systemRoutes);

/**
 * health
 */
app.use('/api/health', (req: Request, res: Response, next: NextFunction): void => {
  res.status(200).json({
    success: true,
    message: 'ok'
  });
});

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error'
  });
});

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found'
  });
});

export default app;