const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3030;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : true,
  credentials: true
}));

// Logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Key validation middleware
const requireApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const expectedApiKey = process.env.API_KEY || 'pmp_service_key_2024';
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key is required' });
  }
  
  if (apiKey !== expectedApiKey) {
    return res.status(403).json({ error: 'Invalid API key' });
  }
  
  next();
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'PMP Question Service',
    version: '1.0.0'
  });
});

// PMP Questions endpoint
app.get('/api/pmp-questions', requireApiKey, async (req, res) => {
  try {
    console.log('🚨🚨🚨 UPDATED CODE IS RUNNING - FILTERING FOR is_valid === false 🚨🚨🚨');
    
    const questionFiles = ['in.ts', 'pl.ts', 'ex.ts', 'mc.ts', 'cl.ts'];
    let allQuestions = [];
    
    for (const file of questionFiles) {
      try {
        const filePath = path.join(__dirname, 'src', 'questions', file);
        const content = await fs.readFile(filePath, 'utf8');
        
        // Extract questions from the TypeScript file
        const questionMatches = content.match(/export const questions = (\[[\s\S]*?\]);/);
        if (questionMatches) {
          const questionsStr = questionMatches[1];
          const questions = eval(questionsStr);
          console.log(`Found ${questions.length} questions in ${file}`);
          allQuestions = allQuestions.concat(questions);
        }
      } catch (error) {
        console.error(`Error reading ${file}:`, error.message);
      }
    }
    
    console.log(`Total questions loaded: ${allQuestions.length}`);
    
    // Filter for questions where is_valid === false
    const invalidQuestions = allQuestions.filter(q => q.is_valid === false);
    console.log(`After is_valid === false filter: ${invalidQuestions.length} questions`);
    
    // Apply count limit
    const count = parseInt(req.query.count) || 100;
    const limitedQuestions = invalidQuestions.slice(0, count);
    console.log(`After count limit (${count}): ${limitedQuestions.length} questions`);
    
    console.log(`Final result: ${limitedQuestions.length} questions`);
    
    res.json({ questions: limitedQuestions });
  } catch (error) {
    console.error('Error retrieving questions:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'PMP Question Service API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      questions: '/api/pmp-questions'
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
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API Key: pmp_service_key_2024`);
  console.log(`Endpoint: http://localhost:${PORT}/api/pmp-questions`);
}); 