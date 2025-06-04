import express from 'express';
import cors from 'cors';
import { generateApiKey } from './utils/apiKeyService.js';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Generate a default API key
const defaultKey = generateApiKey('Default Key');
console.log('Default API Key:', defaultKey);

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// API key endpoint
app.post('/api-key', (req, res) => {
  const { name } = req.body;
  const key = generateApiKey(name || 'New Key');
  res.json({ key });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 