import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes.js';
import { logger } from '../utils/logger.js';

const app = express();
const PORT = process.env["PORT"] || 3030;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env["NODE_ENV"] === 'production' ? false : true,
  credentials: true
}));

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'PMP Question Service',
    version: process.env["npm_package_version"] || '1.0.0'
  });
});

// API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'PMP Question Service API',
    version: process.env["npm_package_version"] || '1.0.0',
    endpoints: {
      health: '/health',
      questions: '/api/pmp-questions',
      saveRecord: '/api/saveRecord'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env["NODE_ENV"] === 'production' ? 'An unexpected error occurred' : error.message
  });
});

// Start server only if not in Lambda environment
if (process.env["AWS_LAMBDA_FUNCTION_NAME"] === undefined) {
  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });
}

export { app }; 
export default app; 