import fs from 'fs';
import path from 'path';

// File paths
const files = {
  'Initiating': 'src/questions/in.ts',
  'Planning': 'src/questions/pl.ts', 
  'Executing': 'src/questions/ex.ts',
  'Monitoring and Controlling': 'src/questions/mc.ts',
  'Closing': 'src/questions/cl.ts'
};

function findInvalidQuestions() {
  console.log('🔍 Finding all questions with is_valid: false...\n');
  
  let totalInvalid = 0;
  const invalidQuestions = [];
  
  for (const [processGroup, filePath] of Object.entries(files)) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Extract the questions array from the TypeScript file
      const questionsMatch = content.match(/export const questions: QAResponseIndividual\[\] = (\[[\s\S]*?\]);/);
      
      if (!questionsMatch) {
        console.log(`❌ Could not find questions array in ${filePath}`);
        continue;
      }
      
      // Parse the questions (remove TypeScript syntax)
      const questionsStr = questionsMatch[1]
        .replace(/QAResponseIndividual/g, '')
        .replace(/as const/g, '');
      
      const questions = eval(questionsStr);
      
      const invalidInFile = questions.filter(q => q.is_valid === false);
      totalInvalid += invalidInFile.length;
      
      console.log(`📁 ${processGroup}: ${invalidInFile.length} invalid questions`);
      
      invalidInFile.forEach(q => {
        invalidQuestions.push({
          id: q.id,
          processGroup,
          question: q.question_pmp,
          correctAnswer: q.correct_answer,
          options: q.options,
          currentNotes: q.additional_notes || 'No notes currently'
        });
      });
      
    } catch (error) {
      console.log(`❌ Error reading ${filePath}:`, error.message);
    }
  }
  
  console.log(`\n📊 Total invalid questions found: ${totalInvalid}`);
  
  // Save to file for review
  const outputPath = 'invalid_questions_for_update.json';
  fs.writeFileSync(outputPath, JSON.stringify(invalidQuestions, null, 2));
  console.log(`\n💾 Invalid questions saved to: ${outputPath}`);
  
  // Display first few for preview
  console.log('\n📋 Preview of first 3 invalid questions:');
  invalidQuestions.slice(0, 3).forEach((q, index) => {
    console.log(`\n${index + 1}. ID: ${q.id} (${q.processGroup})`);
    console.log(`Question: ${q.question.substring(0, 100)}...`);
    console.log(`Correct Answer: ${q.correctAnswer}`);
    console.log(`Current Notes: ${q.currentNotes.substring(0, 100)}...`);
  });
  
  return invalidQuestions;
}

findInvalidQuestions(); 