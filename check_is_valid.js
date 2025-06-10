import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function checkIsValidStatus() {
  const files = [
    { name: 'in.ts', displayName: 'Initiating' },
    { name: 'pl.ts', displayName: 'Planning' },
    { name: 'ex.ts', displayName: 'Executing' },
    { name: 'mc.ts', displayName: 'Monitoring and Controlling' },
    { name: 'cl.ts', displayName: 'Closing' }
  ];
  
  const results = [];

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
      
      const totalQuestions = questions.length;
      const validQuestions = questions.filter(q => q.is_valid === true).length;
      const invalidQuestions = questions.filter(q => q.is_valid === false).length;
      const undefinedQuestions = questions.filter(q => q.is_valid === undefined).length;
      
      results.push({
        file: file.displayName,
        total: totalQuestions,
        valid: validQuestions,
        invalid: invalidQuestions,
        undefined: undefinedQuestions,
        validRate: ((validQuestions / totalQuestions) * 100).toFixed(1)
      });
      
    } catch (error) {
      console.error(`Error processing ${file.name}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('QUESTION IS_VALID STATUS BREAKDOWN');
  console.log('='.repeat(80));
  
  let totalAllQuestions = 0;
  let totalValid = 0;
  let totalInvalid = 0;
  let totalUndefined = 0;
  
  results.forEach(result => {
    console.log(`\n📁 ${result.file}`);
    console.log(`   Total Questions: ${result.total}`);
    console.log(`   ✅ Valid (TRUE): ${result.valid}`);
    console.log(`   ❌ Invalid (FALSE): ${result.invalid}`);
    console.log(`   ❓ Undefined: ${result.undefined}`);
    console.log(`   📊 Valid Rate: ${result.validRate}%`);
    
    totalAllQuestions += result.total;
    totalValid += result.valid;
    totalInvalid += result.invalid;
    totalUndefined += result.undefined;
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('OVERALL SUMMARY');
  console.log('='.repeat(80));
  console.log(`📊 Total Questions Across All Files: ${totalAllQuestions}`);
  console.log(`✅ Total Valid (TRUE): ${totalValid}`);
  console.log(`❌ Total Invalid (FALSE): ${totalInvalid}`);
  console.log(`❓ Total Undefined: ${totalUndefined}`);
  console.log(`📈 Overall Valid Rate: ${((totalValid / totalAllQuestions) * 100).toFixed(1)}%`);
  
  // Files that need attention
  const filesNeedingAttention = results.filter(r => r.validRate < 100);
  if (filesNeedingAttention.length > 0) {
    console.log('\n⚠️  FILES NEEDING ATTENTION:');
    filesNeedingAttention.forEach(file => {
      console.log(`   - ${file.file}: ${file.validRate}% valid (${file.invalid + file.undefined} questions need validation)`);
    });
  } else {
    console.log('\n🎉 All files have 100% valid rate!');
  }
}

checkIsValidStatus().catch(console.error); 