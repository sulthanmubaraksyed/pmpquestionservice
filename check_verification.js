import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function checkVerificationStatus() {
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
      const verifiedQuestions = questions.filter(q => q.is_verified === true).length;
      const unverifiedQuestions = questions.filter(q => q.is_verified === false).length;
      const undefinedQuestions = questions.filter(q => q.is_verified === undefined).length;
      
      results.push({
        file: file.displayName,
        total: totalQuestions,
        verified: verifiedQuestions,
        unverified: unverifiedQuestions,
        undefined: undefinedQuestions,
        verificationRate: ((verifiedQuestions / totalQuestions) * 100).toFixed(1)
      });
      
    } catch (error) {
      console.error(`Error processing ${file.name}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('QUESTION VERIFICATION STATUS BREAKDOWN');
  console.log('='.repeat(80));
  
  let totalAllQuestions = 0;
  let totalVerified = 0;
  let totalUnverified = 0;
  let totalUndefined = 0;
  
  results.forEach(result => {
    console.log(`\n📁 ${result.file} (${result.file})`);
    console.log(`   Total Questions: ${result.total}`);
    console.log(`   ✅ Verified: ${result.verified}`);
    console.log(`   ❌ Unverified: ${result.unverified}`);
    console.log(`   ❓ Undefined: ${result.undefined}`);
    console.log(`   📊 Verification Rate: ${result.verificationRate}%`);
    
    totalAllQuestions += result.total;
    totalVerified += result.verified;
    totalUnverified += result.unverified;
    totalUndefined += result.undefined;
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('OVERALL SUMMARY');
  console.log('='.repeat(80));
  console.log(`📊 Total Questions Across All Files: ${totalAllQuestions}`);
  console.log(`✅ Total Verified: ${totalVerified}`);
  console.log(`❌ Total Unverified: ${totalUnverified}`);
  console.log(`❓ Total Undefined: ${totalUndefined}`);
  console.log(`📈 Overall Verification Rate: ${((totalVerified / totalAllQuestions) * 100).toFixed(1)}%`);
  
  // Files that need attention
  const filesNeedingAttention = results.filter(r => r.verificationRate < 100);
  if (filesNeedingAttention.length > 0) {
    console.log('\n⚠️  FILES NEEDING ATTENTION:');
    filesNeedingAttention.forEach(file => {
      console.log(`   - ${file.file}: ${file.verificationRate}% verified (${file.unverified + file.undefined} questions need verification)`);
    });
  } else {
    console.log('\n🎉 All files have 100% verification rate!');
  }
}

checkVerificationStatus().catch(console.error); 