import { Request, Response, NextFunction } from 'express';
import { validateApiKey } from '../utils/apiKeyService.js';

export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  // Get API key from header
  const apiKey = req.header('X-API-Key');

  if (!apiKey) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'API key is required'
    });
    return;
  }

  if (!validateApiKey(apiKey)) {
    res.status(403).json({
      error: 'Forbidden',
      message: 'Invalid API key'
    });
    return;
  }

  next();
} 