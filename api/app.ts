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
import aiPersonalityRoutes from './routes/ai-personality.js';
import campaignsRoutes from './routes/campaigns.js';
import investigationRoutes from './routes/investigation.js';
import systemRoutes from './routes/system.js';

// Phase 6 API Routes
import guildsRoutes from './routes/guilds.js';
import companionsRoutes from './routes/companions.js';
import socialRoutes from './routes/social.js';
import syncRoutes from './routes/sync.js';
import guildWarsRoutes from './routes/guild-wars.js';
import mentorshipRoutes from './routes/mentorship.js';
import marketplaceRoutes from './routes/marketplace.js';

// Phase 6 Middleware
import { requestLogger, corsHandler, errorHandler } from './middleware/phase6.js';

// for esm mode
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// load env
dotenv.config();


const app: express.Application = express();

// Phase 6 middleware
app.use(corsHandler);
app.use(requestLogger);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * API Routes
 */
// Core game routes
app.use('/api/auth', authRoutes);
app.use('/api/hacking', hackingRoutes);
app.use('/api/story', storyRoutes);
app.use('/api/intelligence', intelligenceRoutes);
app.use('/api/partners', partnersRoutes);
app.use('/api/ai-partners', aiPartnersRoutes);
app.use('/api/ai-personality', aiPersonalityRoutes);
app.use('/api/campaigns', campaignsRoutes);
app.use('/api/investigation', investigationRoutes);
app.use('/api/system', systemRoutes);

// Phase 6 routes - Advanced social and AI systems
app.use('/api/guilds', guildsRoutes);
app.use('/api/companions', companionsRoutes);
app.use('/api/friends', socialRoutes);
app.use('/api/messages', socialRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/sync', syncRoutes);
app.use('/api/guild-wars', guildWarsRoutes);
app.use('/api/mentorship', mentorshipRoutes);
app.use('/api/marketplace', marketplaceRoutes);

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
app.use(errorHandler);

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