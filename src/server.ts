import express from 'express';
import cors from 'cors';
import { listApiKeys } from './utils/apiKeyService.js';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// List available API keys
const keys = listApiKeys();
console.log('Available API Keys:', keys);

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// API key endpoint
app.get('/api-keys', (req, res) => {
  const keys = listApiKeys();
  res.json({ keys });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 