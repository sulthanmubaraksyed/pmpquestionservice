const fs = require('fs');
const path = require('path');

console.log('Testing options_pmp parsing...\n');

const filePath = path.join(__dirname, 'src', 'questions', 'in.ts');
const fileContent = fs.readFileSync(filePath, 'utf-8');

// Extract the JSON data from the TypeScript export
const jsonMatch = fileContent.match(/export const questionsData = ({[\s\S]*});/);
if (!jsonMatch) {
  console.log('❌ Could not extract JSON from file');
  process.exit(1);
}

const data = JSON.parse(jsonMatch[1]);
const questions = data.questions || [];

console.log(`Found ${questions.length} questions`);

// Find the specific question
const targetQuestion = questions.find(q => q.id === '1717049940186');
if (targetQuestion) {
  console.log('\n=== Question Details ===');
  console.log('ID:', targetQuestion.id);
  console.log('Question Type:', targetQuestion.question_type);
  console.log('Options PMP:', JSON.stringify(targetQuestion.options_pmp, null, 2));
  console.log('Has OPTION_A:', !!targetQuestion.OPTION_A);
  console.log('Has OPTION_B:', !!targetQuestion.OPTION_B);
  console.log('Has OPTION_C:', !!targetQuestion.OPTION_C);
  console.log('Has OPTION_D:', !!targetQuestion.OPTION_D);
  console.log('Has OPTION_E:', !!targetQuestion.OPTION_E);
  
  // Check if options_pmp has the expected structure
  if (targetQuestion.options_pmp) {
    console.log('\n=== Options PMP Structure ===');
    console.log('OPTION_A:', targetQuestion.options_pmp.OPTION_A);
    console.log('OPTION_B:', targetQuestion.options_pmp.OPTION_B);
    console.log('OPTION_C:', targetQuestion.options_pmp.OPTION_C);
    console.log('OPTION_D:', targetQuestion.options_pmp.OPTION_D);
    console.log('OPTION_E:', targetQuestion.options_pmp.OPTION_E);
  } else {
    console.log('\n❌ options_pmp is null or undefined');
  }
} else {
  console.log('❌ Question not found');
} 