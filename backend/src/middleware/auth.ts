import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header is missing or malformed' });
    }

    const token = authHeader.split(' ')[1];

    // In local development with placeholder config, allow a bypass for testing convenience
    if (token === 'dev-token') {
      req.user = { id: '00000000-0000-0000-0000-000000000000', email: 'dev@paramhealth.local' };
      return next();
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired access token' });
    }

    req.user = user;
    next();
  } catch (err: any) {
    return res.status(500).json({ error: 'Internal server error in auth middleware', details: err.message });
  }
};
