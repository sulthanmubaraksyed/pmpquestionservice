import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function checkDuplicateIds() {
  const files = ['in.ts', 'pl.ts', 'ex.ts', 'mc.ts', 'cl.ts'];
  const allIds = new Map(); // Map to track ID -> {file, index}
  const duplicates = [];
  const withinFileDuplicates = [];

  for (const file of files) {
    try {
      const filePath = path.join(__dirname, 'src/questions', file);
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Extract the questions array using regex
      const match = content.match(/questionsData\s*=\s*({[\s\S]*?"questions"\s*:\s*)(\[[\s\S]*?\])(\s*})/);
      if (!match) {
        console.log(`Could not parse questions array in ${file}`);
        continue;
      }
      
      const questionsArrayStr = match[2];
      const questions = JSON.parse(questionsArrayStr);
      
      console.log(`\nChecking ${file}: ${questions.length} questions`);
      
      // Check for duplicates within this file
      const fileIds = new Map();
      questions.forEach((question, index) => {
        const id = question.id;
        if (fileIds.has(id)) {
          withinFileDuplicates.push({
            file,
            id,
            index1: fileIds.get(id),
            index2: index
          });
        } else {
          fileIds.set(id, index);
        }
        
        // Check for duplicates across all files
        if (allIds.has(id)) {
          const existing = allIds.get(id);
          duplicates.push({
            id,
            file1: existing.file,
            index1: existing.index,
            file2: file,
            index2: index
          });
        } else {
          allIds.set(id, { file, index });
        }
      });
      
    } catch (error) {
      console.error(`Error processing ${file}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('DUPLICATE ID CHECK RESULTS');
  console.log('='.repeat(60));
  
  // Check within-file duplicates
  if (withinFileDuplicates.length === 0) {
    console.log('✅ No duplicate IDs found within individual files!');
  } else {
    console.log(`❌ Found ${withinFileDuplicates.length} duplicate ID(s) within files:`);
    withinFileDuplicates.forEach((dup, index) => {
      console.log(`\n${index + 1}. File: ${dup.file}, ID: ${dup.id}`);
      console.log(`   - Index: ${dup.index1} and ${dup.index2}`);
    });
  }
  
  // Check across-file duplicates
  if (duplicates.length === 0) {
    console.log('\n✅ No duplicate IDs found across different files!');
  } else {
    console.log(`\n❌ Found ${duplicates.length} duplicate ID(s) across files:`);
    duplicates.forEach((dup, index) => {
      console.log(`\n${index + 1}. ID: ${dup.id}`);
      console.log(`   - ${dup.file1} (index: ${dup.index1})`);
      console.log(`   - ${dup.file2} (index: ${dup.index2})`);
    });
  }
  
  console.log(`\nTotal unique IDs: ${allIds.size}`);
}

checkDuplicateIds().catch(console.error); 