import { Request, Response, NextFunction } from 'express';
import passport from '@/config/passport';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  passport.authenticate('jwt', { session: false }, (err: unknown, user: Express.User | false) => {
    if (err || !user) {
      res.status(401).json({ success: false, message: 'Non autorisé. Token manquant ou invalide.' });
      return;
    }
    req.user = user;
    next();
  })(req, res, next);
}
