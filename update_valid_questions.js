import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function updateValidQuestions() {
  const filePath = path.join(__dirname, 'src/questions', 'pl.ts');
  
  try {
    console.log('Reading pl.ts file...');
    const content = await fs.readFile(filePath, 'utf-8');
    
    const match = content.match(/questionsData\s*=\s*({[\s\S]*?"questions"\s*:\s*)(\[[\s\S]*?\])(\s*})/);
    if (!match) {
      console.error('Could not parse questions array');
      return;
    }
    
    const prefix = match[1];
    const questionsArrayStr = match[2];
    const suffix = match[3];
    
    console.log('Parsing questions array...');
    let questions = JSON.parse(questionsArrayStr);
    
    console.log(`Found ${questions.length} questions in pl.ts`);
    
    // Find and update the two questions with is_valid: true
    const validQuestionIds = ['1717049951186', '1717049953186'];
    let updatedCount = 0;
    
    questions.forEach((q, index) => {
      if (validQuestionIds.includes(q.id) && q.is_valid === true) {
        console.log(`Updating question ${q.id} from is_valid: true to is_valid: false`);
        questions[index].is_valid = false;
        updatedCount++;
      }
    });
    
    if (updatedCount === 0) {
      console.log('No questions found to update');
      return;
    }
    
    console.log(`Updated ${updatedCount} questions`);
    
    // Re-stringify the questions array
    const newQuestionsStr = JSON.stringify(questions, null, 2);
    
    // Rebuild the file content
    const newFileContent = `export const questionsData = ${prefix}${newQuestionsStr}${suffix};\n`;
    
    // Write back to the file
    console.log('Writing updated content to pl.ts...');
    await fs.writeFile(filePath, newFileContent, 'utf-8');
    
    console.log('✅ Successfully updated pl.ts file!');
    
  } catch (error) {
    console.error('Error updating file:', error);
  }
}

updateValidQuestions(); 