import express from 'express';
import cors from 'cors';
import questionRoutes from './routes.js';
import { logger } from '../utils/logger.js';

const app = express();
const port = process.env.PORT || 3030;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', questionRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  logger.info('Health check requested');
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred'
  });
});

// Start server
app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});

export default app; 