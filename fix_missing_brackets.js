import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fixMissingBrackets() {
  const questionsDir = path.join(__dirname, 'src', 'questions');
  const files = ['in.ts', 'pl.ts', 'ex.ts', 'mc.ts', 'cl.ts'];
  
  console.log('=== Fixing Missing Closing Brackets ===\n');
  
  for (const file of files) {
    const filePath = path.join(questionsDir, file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`${file}: File not found`);
      continue;
    }
    
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let originalContent = content;
      // Remove trailing whitespace/newlines
      content = content.replace(/\s+$/g, '');
      // Replace the last occurrence of '};' at the end of the file with ']}';
      content = content.replace(/};\s*$/g, ']}');
      // Add a semicolon at the end if missing
      if (!content.endsWith(';')) {
        content += ';';
      }
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Fixed missing closing bracket in ${file}`);
      } else {
        console.log(`✅ No changes needed for ${file}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  }
  
  console.log('\n=== Missing Bracket Fix Complete ===');
}

fixMissingBrackets(); 