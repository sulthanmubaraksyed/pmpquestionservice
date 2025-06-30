import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the load_Questions.json file
const filePath = path.join(__dirname, 'src/utils/loadFiles/load_Questions.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

// Add is_sample attribute to each question
data.questions = data.questions.map(question => ({
    ...question,
    is_sample: question.is_sample || "No"
}));

// Write the updated data back to the file
fs.writeFileSync(filePath, JSON.stringify(data, null, 4), 'utf8');

console.log(`✅ Added is_sample attribute to ${data.questions.length} questions in load_Questions.json`);
console.log('All questions now have is_sample set to "No" by default'); 