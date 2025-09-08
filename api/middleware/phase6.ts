/**
 * Phase 6 API Middleware
 * Authentication, validation, rate limiting, and error handling for Phase 6 endpoints
 */
import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        username?: string;
        level?: number;
        guild_id?: string;
        role?: string;
      };
      rateLimit?: {
        limit: number;
        remaining: number;
        reset: Date;
      };
    }
  }
}

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Authentication middleware for Phase 6 endpoints
 */
export const authenticateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, error: 'Authentication token required' });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      res.status(401).json({ success: false, error: 'Invalid or expired token' });
      return;
    }

    // Get additional user info from database
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select(`
        id,
        username,
        level,
        experience,
        credits,
        guild_members(
          guild_id,
          role
        )
      `)
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      res.status(500).json({ success: false, error: 'Failed to fetch user profile' });
      return;
    }

    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email || '',
      username: userProfile?.username,
      level: userProfile?.level,
      guild_id: userProfile?.guild_members?.[0]?.guild_id,
      role: userProfile?.guild_members?.[0]?.role
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ success: false, error: 'Authentication failed' });
  }
};

/**
 * Rate limiting middleware
 */
export const rateLimit = (options: {
  windowMs: number;
  maxRequests: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = `${req.ip}-${req.path}`;
    const now = Date.now();
    const windowStart = now - options.windowMs;

    // Clean up old entries
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetTime < now) {
        rateLimitStore.delete(k);
      }
    }

    // Get or create rate limit entry
    let entry = rateLimitStore.get(key);
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + options.windowMs
      };
      rateLimitStore.set(key, entry);
    }

    // Check if limit exceeded
    if (entry.count >= options.maxRequests) {
      res.status(429).json({
        success: false,
        error: options.message || 'Too many requests, please try again later',
        retryAfter: Math.ceil((entry.resetTime - now) / 1000)
      });
      return;
    }

    // Increment counter
    entry.count++;

    // Add rate limit info to request
    req.rateLimit = {
      limit: options.maxRequests,
      remaining: options.maxRequests - entry.count,
      reset: new Date(entry.resetTime)
    };

    // Add headers
    res.set({
      'X-RateLimit-Limit': options.maxRequests.toString(),
      'X-RateLimit-Remaining': req.rateLimit.remaining.toString(),
      'X-RateLimit-Reset': req.rateLimit.reset.toISOString()
    });

    next();
  };
};

/**
 * Guild membership validation middleware
 */
export const requireGuildMembership = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { data: guildMember, error } = await supabase
      .from('guild_members')
      .select(`
        guild_id,
        role,
        joined_at,
        guild:guilds(
          id,
          name,
          level
        )
      `)
      .eq('user_id', userId)
      .single();

    if (error || !guildMember) {
      res.status(403).json({ success: false, error: 'Guild membership required' });
      return;
    }

    // Add guild info to request
    req.user = {
      ...req.user,
      guild_id: guildMember.guild_id,
      role: guildMember.role
    };

    next();
  } catch (error) {
    console.error('Guild membership validation error:', error);
    res.status(500).json({ success: false, error: 'Failed to validate guild membership' });
  }
};

/**
 * Guild leadership validation middleware (leader or officer)
 */
export const requireGuildLeadership = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { data: guildMember, error } = await supabase
      .from('guild_members')
      .select('guild_id, role')
      .eq('user_id', userId)
      .single();

    if (error || !guildMember) {
      res.status(403).json({ success: false, error: 'Guild membership required' });
      return;
    }

    if (!['leader', 'officer'].includes(guildMember.role)) {
      res.status(403).json({ 
        success: false, 
        error: 'Guild leadership role (leader or officer) required' 
      });
      return;
    }

    // Add guild info to request
    req.user = {
      ...req.user,
      guild_id: guildMember.guild_id,
      role: guildMember.role
    };

    next();
  } catch (error) {
    console.error('Guild leadership validation error:', error);
    res.status(500).json({ success: false, error: 'Failed to validate guild leadership' });
  }
};

/**
 * Input validation middleware
 */
export const validateInput = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details.map((detail: any) => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
      return;
    }

    next();
  };
};

/**
 * Companion ownership validation middleware
 */
export const validateCompanionOwnership = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const companionId = req.params.id || req.body.companion_id;

    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    if (!companionId) {
      res.status(400).json({ success: false, error: 'Companion ID required' });
      return;
    }

    const { data: companion, error } = await supabase
      .from('ai_companions')
      .select('id, owner_id, name')
      .eq('id', companionId)
      .single();

    if (error || !companion) {
      res.status(404).json({ success: false, error: 'Companion not found' });
      return;
    }

    if (companion.owner_id !== userId) {
      res.status(403).json({ success: false, error: 'You do not own this companion' });
      return;
    }

    next();
  } catch (error) {
    console.error('Companion ownership validation error:', error);
    res.status(500).json({ success: false, error: 'Failed to validate companion ownership' });
  }
};

/**
 * Level requirement middleware
 */
export const requireLevel = (minLevel: number) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const { data: user, error } = await supabase
        .from('users')
        .select('level')
        .eq('id', userId)
        .single();

      if (error || !user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      if ((user.level || 1) < minLevel) {
        res.status(403).json({ 
          success: false, 
          error: `Level ${minLevel} required. Your current level: ${user.level || 1}` 
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Level requirement validation error:', error);
      res.status(500).json({ success: false, error: 'Failed to validate level requirement' });
    }
  };
};

/**
 * Credits requirement middleware
 */
export const requireCredits = (minCredits: number) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ success: false, error: 'Authentication required' });
        return;
      }

      const { data: user, error } = await supabase
        .from('users')
        .select('credits')
        .eq('id', userId)
        .single();

      if (error || !user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      if ((user.credits || 0) < minCredits) {
        res.status(403).json({ 
          success: false, 
          error: `${minCredits} credits required. Your current credits: ${user.credits || 0}` 
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Credits requirement validation error:', error);
      res.status(500).json({ success: false, error: 'Failed to validate credits requirement' });
    }
  };
};

/**
 * Error handling middleware for Phase 6
 */
export const errorHandler = (error: any, req: Request, res: Response, next: NextFunction): void => {
  console.error('Phase 6 API Error:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    user: req.user?.id,
    timestamp: new Date().toISOString()
  });

  // Handle specific error types
  if (error.code === '23505') { // PostgreSQL unique violation
    res.status(409).json({
      success: false,
      error: 'Resource already exists',
      code: 'DUPLICATE_RESOURCE'
    });
    return;
  }

  if (error.code === '23503') { // PostgreSQL foreign key violation
    res.status(400).json({
      success: false,
      error: 'Invalid reference to related resource',
      code: 'INVALID_REFERENCE'
    });
    return;
  }

  if (error.code === '42P01') { // PostgreSQL table does not exist
    res.status(500).json({
      success: false,
      error: 'Database configuration error',
      code: 'DATABASE_ERROR'
    });
    return;
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details
    });
    return;
  }

  // Handle Supabase errors
  if (error.message && error.message.includes('JWT')) {
    res.status(401).json({
      success: false,
      error: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
    return;
  }

  // Default error response
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { details: error.message })
  });
};

/**
 * Request logging middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - User: ${req.user?.id || 'anonymous'}`);
  });

  next();
};

/**
 * CORS middleware for Phase 6 endpoints
 */
export const corsHandler = (req: Request, res: Response, next: NextFunction): void => {
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }

  next();
};

// Rate limit configurations for different endpoint types
export const rateLimits = {
  // Standard API calls
  standard: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    message: 'Too many requests, please try again later'
  }),

  // Guild operations (more restrictive)
  guild: rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 20,
    message: 'Too many guild operations, please try again later'
  }),

  // Marketplace operations
  marketplace: rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    maxRequests: 30,
    message: 'Too many marketplace operations, please try again later'
  }),

  // Social interactions
  social: rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 50,
    message: 'Too many social interactions, please try again later'
  }),

  // AI companion operations
  companion: rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    maxRequests: 25,
    message: 'Too many companion operations, please try again later'
  })
};

export default {
  authenticateUser,
  rateLimit,
  requireGuildMembership,
  requireGuildLeadership,
  validateInput,
  validateCompanionOwnership,
  requireLevel,
  requireCredits,
  errorHandler,
  requestLogger,
  corsHandler,
  rateLimits
};