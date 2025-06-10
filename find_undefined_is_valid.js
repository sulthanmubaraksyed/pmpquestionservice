import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function findUndefinedIsValid() {
  const files = [
    { name: 'in.ts', displayName: 'Initiating' },
    { name: 'pl.ts', displayName: 'Planning' },
    { name: 'ex.ts', displayName: 'Executing' },
    { name: 'mc.ts', displayName: 'Monitoring and Controlling' },
    { name: 'cl.ts', displayName: 'Closing' }
  ];
  
  console.log('🔍 SEARCHING FOR QUESTIONS WITH UNDEFINED is_valid ATTRIBUTES\n');
  console.log('='.repeat(80));

  for (const file of files) {
    try {
      const filePath = path.join(__dirname, 'src/questions', file.name);
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Extract the questions array using regex
      const match = content.match(/questionsData\s*=\s*({[\s\S]*?"questions"\s*:\s*)(\[[\s\S]*?\])(\s*})/);
      if (!match) {
        console.log(`Could not parse questions array in ${file.name}`);
        continue;
      }
      
      const questionsArrayStr = match[2];
      const questions = JSON.parse(questionsArrayStr);
      
      const undefinedQuestions = questions.filter(q => q.is_valid === undefined);
      
      if (undefinedQuestions.length > 0) {
        console.log(`\n📁 ${file.displayName} (${file.name})`);
        console.log(`   Found ${undefinedQuestions.length} question(s) with undefined is_valid:`);
        
        undefinedQuestions.forEach((q, index) => {
          console.log(`\n   ${index + 1}. Question ID: ${q.id}`);
          console.log(`      Question: ${q.question_pmp.substring(0, 100)}...`);
          console.log(`      Process Group: ${q.process_group || 'N/A'}`);
          console.log(`      Knowledge Area: ${q.knowledge_area || 'N/A'}`);
          console.log(`      is_valid: ${q.is_valid}`);
          console.log(`      has is_valid property: ${q.hasOwnProperty('is_valid')}`);
        });
      }
      
    } catch (error) {
      console.error(`Error processing ${file.name}:`, error.message);
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('🔍 SEARCH COMPLETE');
}

findUndefinedIsValid().catch(console.error); 