import { Request, Response, NextFunction } from 'express';
import { CONFIG } from '../config/constants';

export const validateSecretKey = (req: Request, res: Response, next: NextFunction) => {
  const secretKey = req.body.secret_key || req.query.secret_key;
  
  if (!secretKey) {
    res.status(401).json({
      success: false,
      message: 'Secret key is required'
    });
    return;
  }

  if (secretKey !== CONFIG.SECRET_KEY) {
    res.status(403).json({
      success: false,
      message: 'Invalid secret key'
    });
    return;
  }

  next();
};
