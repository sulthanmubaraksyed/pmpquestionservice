import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to extract questions from a TypeScript file
function extractQuestionsFromFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Find the questions array in the TypeScript export
    const questionsMatch = content.match(/export const questionsData = \{\s*"questions":\s*\[([\s\S]*?)\]\s*\};/);
    
    if (!questionsMatch) {
      console.log(`No questions found in ${filePath}`);
      return [];
    }
    
    const questionsText = questionsMatch[1];
    
    // Split by question objects (looking for the pattern that starts with {)
    const questionObjects = [];
    let currentObject = '';
    let braceCount = 0;
    let inString = false;
    let escapeNext = false;
    
    for (let i = 0; i < questionsText.length; i++) {
      const char = questionsText[i];
      
      if (escapeNext) {
        currentObject += char;
        escapeNext = false;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        currentObject += char;
        continue;
      }
      
      if (char === '"' && !escapeNext) {
        inString = !inString;
      }
      
      if (!inString) {
        if (char === '{') {
          if (braceCount === 0) {
            currentObject = '{';
          } else {
            currentObject += char;
          }
          braceCount++;
        } else if (char === '}') {
          currentObject += char;
          braceCount--;
          if (braceCount === 0) {
            // End of object
            try {
              // Clean up the object text and parse it
              const cleanObject = currentObject.trim();
              if (cleanObject.length > 2) { // More than just {}
                const parsedObject = eval('(' + cleanObject + ')');
                questionObjects.push(parsedObject);
              }
            } catch (parseError) {
              console.log(`Error parsing object in ${filePath}:`, parseError.message);
            }
            currentObject = '';
          }
        } else if (braceCount > 0) {
          currentObject += char;
        }
      } else {
        currentObject += char;
      }
    }
    
    return questionObjects;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return [];
  }
}

// Function to check if a question is invalid
function isInvalidQuestion(question) {
  return question.is_valid === false;
}

// Main function to process all files
function moveInvalidQuestions() {
  const questionsDir = path.join(__dirname, 'src', 'questions');
  const files = ['in.ts', 'pl.ts', 'ex.ts', 'mc.ts', 'cl.ts'];
  
  let allInvalidQuestions = [];
  let totalQuestions = 0;
  let totalInvalidQuestions = 0;
  
  console.log('=== Starting to extract invalid questions ===');
  
  // Process each file
  for (const file of files) {
    const filePath = path.join(questionsDir, file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      continue;
    }
    
    console.log(`\nProcessing ${file}...`);
    const questions = extractQuestionsFromFile(filePath);
    totalQuestions += questions.length;
    
    const invalidQuestions = questions.filter(isInvalidQuestion);
    totalInvalidQuestions += invalidQuestions.length;
    
    console.log(`  Total questions in ${file}: ${questions.length}`);
    console.log(`  Invalid questions in ${file}: ${invalidQuestions.length}`);
    
    // Add source file information to each invalid question
    invalidQuestions.forEach(question => {
      question.sourceFile = file;
    });
    
    allInvalidQuestions.push(...invalidQuestions);
  }
  
  console.log(`\n=== Summary ===`);
  console.log(`Total questions processed: ${totalQuestions}`);
  console.log(`Total invalid questions found: ${totalInvalidQuestions}`);
  
  if (allInvalidQuestions.length === 0) {
    console.log('No invalid questions found to move.');
    return;
  }
  
  // Create backup file content
  const backupContent = `export const backupQuestionsData = {
  "questions": ${JSON.stringify(allInvalidQuestions, null, 2)}
};

// Backup created on: ${new Date().toISOString()}
// Total invalid questions moved: ${allInvalidQuestions.length}
// Source files: ${files.join(', ')}
`;

  // Write backup file
  const backupPath = path.join(__dirname, 'backup.ts');
  fs.writeFileSync(backupPath, backupContent, 'utf8');
  
  console.log(`\nBackup file created: ${backupPath}`);
  console.log(`Invalid questions moved to backup: ${allInvalidQuestions.length}`);
  
  // Show breakdown by source file
  console.log('\n=== Breakdown by source file ===');
  const breakdown = {};
  allInvalidQuestions.forEach(question => {
    const sourceFile = question.sourceFile;
    breakdown[sourceFile] = (breakdown[sourceFile] || 0) + 1;
  });
  
  Object.entries(breakdown).forEach(([file, count]) => {
    console.log(`${file}: ${count} invalid questions`);
  });
}

// Run the script
moveInvalidQuestions(); 