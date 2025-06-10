import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function findValidQuestions() {
  const files = ['in.ts', 'pl.ts', 'ex.ts', 'mc.ts', 'cl.ts'];
  
  for (const file of files) {
    try {
      const filePath = path.join(__dirname, 'src/questions', file);
      const content = await fs.readFile(filePath, 'utf-8');
      
      const match = content.match(/questionsData\s*=\s*({[\s\S]*?"questions"\s*:\s*)(\[[\s\S]*?\])(\s*})/);
      if (!match) continue;
      
      const questionsArrayStr = match[2];
      const questions = JSON.parse(questionsArrayStr);
      
      const validQuestions = questions.filter(q => q.is_valid === true);
      
      if (validQuestions.length > 0) {
        console.log(`\n📁 ${file} - Found ${validQuestions.length} valid questions:`);
        validQuestions.forEach((q, index) => {
          console.log(`  ${index + 1}. ID: ${q.id}`);
          console.log(`     Question: ${q.question_pmp.substring(0, 100)}...`);
          console.log(`     Process Group: ${q.analysis.process_group}`);
          console.log(`     Knowledge Area: ${q.analysis.knowledge_area}`);
          console.log(`     is_valid: ${q.is_valid}`);
          console.log('');
        });
      }
      
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
    }
  }
}

findValidQuestions(); 