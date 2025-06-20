import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function countQuestionsInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const questionsMatch = content.match(/export const questionsData = \{\s*"questions":\s*\[([\s\S]*?)\]\s*\};/);
    
    if (!questionsMatch) {
      return 0;
    }
    
    const questionsText = questionsMatch[1];
    // Count the number of question objects by counting opening braces that start a new object
    const questionCount = (questionsText.match(/\{[^{}]*"id":/g) || []).length;
    
    return questionCount;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return 0;
  }
}

function countAllQuestions() {
  const questionsDir = path.join(__dirname, 'src', 'questions');
  const files = ['in.ts', 'pl.ts', 'ex.ts', 'mc.ts', 'cl.ts'];
  
  console.log('=== Question Count After Deletion ===\n');
  
  let totalQuestions = 0;
  
  for (const file of files) {
    const filePath = path.join(questionsDir, file);
    const count = countQuestionsInFile(filePath);
    console.log(`${file}: ${count} questions`);
    totalQuestions += count;
  }
  
  console.log(`\nTotal questions across all files: ${totalQuestions}`);
}

countAllQuestions(); 