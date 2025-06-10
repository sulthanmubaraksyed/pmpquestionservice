import crypto from 'crypto';
import { logger } from './logger.js';

// Persistent API key for the service
const PERSISTENT_API_KEY = 'pmp_service_key_2024';

// In-memory storage for API keys (in production, this should be in a database)
const apiKeys = new Map<string, {
  key: string;
  name: string;
  createdAt: Date;
  lastUsed: Date | null;
}>();

// Initialize with the persistent API key
apiKeys.set(PERSISTENT_API_KEY, {
  key: PERSISTENT_API_KEY,
  name: 'PMP Service API Key',
  createdAt: new Date(),
  lastUsed: null
});

/**
 * Validate an API key
 * @param key The API key to validate
 * @returns boolean indicating if the key is valid
 */
export function validateApiKey(key: string): boolean {
  if (!key || !apiKeys.has(key)) {
    logger.warn('Invalid API key attempt', { key: key ? key.substring(0, 8) + '...' : 'undefined' });
    return false;
  }

  // Update last used timestamp
  const keyData = apiKeys.get(key);
  if (keyData) {
    keyData.lastUsed = new Date();
    apiKeys.set(key, keyData);
    logger.debug('API key validated successfully', { key: key.substring(0, 8) + '...' });
  }

  return true;
}

/**
 * List all API keys (excluding the actual key value for security)
 * @returns Array of API key metadata
 */
export function listApiKeys() {
  logger.info('API keys list requested');
  return Array.from(apiKeys.values()).map(({ key, ...metadata }) => ({
    ...metadata,
    key: key.substring(0, 8) + '...' // Only show first 8 characters
  }));
}

/**
 * Revoke an API key
 * @param key The API key to revoke
 * @returns boolean indicating if the key was revoked
 */
export function revokeApiKey(key: string): boolean {
  const wasRevoked = apiKeys.delete(key);
  if (wasRevoked) {
    logger.info('API key revoked', { key: key.substring(0, 8) + '...' });
  } else {
    logger.warn('Attempted to revoke non-existent API key', { key: key.substring(0, 8) + '...' });
  }
  return wasRevoked;
}

// Log the persistent API key on startup
logger.info('PMP Service API Key initialized', { key: PERSISTENT_API_KEY }); 