import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fixJsonErrors() {
  const questionsDir = path.join(__dirname, 'src', 'questions');
  const files = ['in.ts', 'pl.ts', 'ex.ts', 'mc.ts', 'cl.ts'];
  
  console.log('=== Fixing JSON Errors ===\n');
  
  for (const file of files) {
    const filePath = path.join(questionsDir, file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`${file}: File not found`);
      continue;
    }
    
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let originalContent = content;
      
      // Fix common JSON syntax errors
      
      // 1. Fix missing commas before "difficulty_level"
      content = content.replace(/(\s*)"difficulty_level":/g, ',\n    "difficulty_level":');
      
      // 2. Fix missing commas before "is_valid"
      content = content.replace(/(\s*)"is_valid":/g, ',\n    "is_valid":');
      
      // 3. Fix missing commas before "additional_notes"
      content = content.replace(/(\s*)"additional_notes":/g, ',\n    "additional_notes":');
      
      // 4. Fix missing commas before "explanation"
      content = content.replace(/(\s*)"explanation":/g, ',\n    "explanation":');
      
      // 5. Fix missing commas before "correct_answer"
      content = content.replace(/(\s*)"correct_answer":/g, ',\n    "correct_answer":');
      
      // 6. Fix missing commas before "options"
      content = content.replace(/(\s*)"options":/g, ',\n    "options":');
      
      // 7. Fix missing commas before "question"
      content = content.replace(/(\s*)"question":/g, ',\n    "question":');
      
      // 8. Fix missing commas before "id"
      content = content.replace(/(\s*)"id":/g, ',\n    "id":');
      
      // 9. Remove any double commas that might have been created
      content = content.replace(/,\s*,/g, ',');
      
      // 10. Fix any trailing commas before closing braces
      content = content.replace(/,(\s*})/g, '$1');
      
      // 11. Fix any trailing commas before closing brackets
      content = content.replace(/,(\s*\])/g, '$1');
      
      // Write the fixed content back to the file
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Fixed JSON errors in ${file}`);
      } else {
        console.log(`✅ No changes needed for ${file}`);
      }
      
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  }
  
  console.log('\n=== JSON Error Fix Complete ===');
}

fixJsonErrors(); 