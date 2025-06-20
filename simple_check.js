import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function simpleCheck() {
  const questionsDir = path.join(__dirname, 'src', 'questions');
  const files = ['in.ts', 'pl.ts', 'ex.ts', 'mc.ts', 'cl.ts'];
  
  console.log('=== Simple Question Check ===\n');
  
  for (const file of files) {
    const filePath = path.join(questionsDir, file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`${file}: File not found`);
      continue;
    }
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const fileSize = fs.statSync(filePath).size;
      
      // Count "is_valid": true and "is_valid": false
      const validCount = (content.match(/"is_valid":\s*true/g) || []).length;
      const invalidCount = (content.match(/"is_valid":\s*false/g) || []).length;
      
      console.log(`${file}:`);
      console.log(`  File size: ${fileSize} bytes`);
      console.log(`  Valid questions: ${validCount}`);
      console.log(`  Invalid questions: ${invalidCount}`);
      console.log(`  Total: ${validCount + invalidCount}`);
      console.log('');
      
    } catch (error) {
      console.log(`${file}: Error reading file - ${error.message}`);
    }
  }
}

simpleCheck(); 