import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function debugFilter() {
  const files = ['in.ts', 'pl.ts', 'ex.ts', 'mc.ts', 'cl.ts'];
  let totalQuestions = 0;
  let validQuestions = 0;
  let invalidQuestions = 0;
  let undefinedQuestions = 0;

  for (const file of files) {
    try {
      const filePath = path.join(__dirname, 'src/questions', file);
      const content = await fs.readFile(filePath, 'utf-8');
      
      const match = content.match(/questionsData\s*=\s*({[\s\S]*?"questions"\s*:\s*)(\[[\s\S]*?\])(\s*})/);
      if (!match) continue;
      
      const questionsArrayStr = match[2];
      const questions = JSON.parse(questionsArrayStr);
      
      totalQuestions += questions.length;
      
      questions.forEach((q, index) => {
        console.log(`${file} - Question ${index + 1}:`);
        console.log(`  ID: ${q.id}`);
        console.log(`  is_valid: ${q.is_valid} (type: ${typeof q.is_valid})`);
        console.log(`  hasOwnProperty('is_valid'): ${q.hasOwnProperty('is_valid')}`);
        console.log(`  q.is_valid !== false: ${q.is_valid !== false}`);
        console.log('');
        
        if (q.is_valid === true) {
          validQuestions++;
        } else if (q.is_valid === false) {
          invalidQuestions++;
        } else {
          undefinedQuestions++;
        }
      });
      
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
    }
  }

  console.log(`\nSUMMARY:`);
  console.log(`Total Questions: ${totalQuestions}`);
  console.log(`Valid (TRUE): ${validQuestions}`);
  console.log(`Invalid (FALSE): ${invalidQuestions}`);
  console.log(`Undefined/Null: ${undefinedQuestions}`);
  console.log(`Expected to be returned by filter: ${invalidQuestions}`);
}

debugFilter(); 