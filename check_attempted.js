import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function checkAttemptedStatus() {
  const files = ['in.ts', 'pl.ts', 'ex.ts', 'mc.ts', 'cl.ts'];
  let totalQuestions = 0;
  let attemptedQuestions = 0;
  let unattemptedQuestions = 0;

  for (const file of files) {
    try {
      const filePath = path.join(__dirname, 'src/questions', file);
      const content = await fs.readFile(filePath, 'utf-8');
      
      const match = content.match(/questionsData\s*=\s*({[\s\S]*?"questions"\s*:\s*)(\[[\s\S]*?\])(\s*})/);
      if (!match) continue;
      
      const questionsArrayStr = match[2];
      const questions = JSON.parse(questionsArrayStr);
      
      totalQuestions += questions.length;
      const attempted = questions.filter(q => q.is_attempted === true).length;
      const unattempted = questions.filter(q => q.is_attempted !== true).length;
      
      attemptedQuestions += attempted;
      unattemptedQuestions += unattempted;
      
      console.log(`${file}: ${questions.length} total, ${attempted} attempted, ${unattempted} unattempted`);
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
    }
  }

  console.log(`\nSUMMARY:`);
  console.log(`Total Questions: ${totalQuestions}`);
  console.log(`Attempted: ${attemptedQuestions}`);
  console.log(`Unattempted: ${unattemptedQuestions}`);
  console.log(`Expected to be returned by service: ${unattemptedQuestions}`);
}

checkAttemptedStatus(); 