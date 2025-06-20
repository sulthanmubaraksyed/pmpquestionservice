const fs = require('fs');
const path = require('path');

const questionFiles = ['in.ts', 'pl.ts', 'ex.ts', 'mc.ts', 'cl.ts'];

console.log('Ensuring OPTION_E and option_e_result for multiselect questions...\n');

questionFiles.forEach(fileName => {
  const filePath = path.join(__dirname, 'src', 'questions', fileName);
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${fileName}`);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  // Extract JSON
  const jsonMatch = content.match(/export const questionsData = ({[\s\S]*});/);
  if (!jsonMatch) {
    console.log(`❌ Could not extract JSON from ${fileName}`);
    return;
  }
  let data;
  try {
    data = JSON.parse(jsonMatch[1]);
  } catch (e) {
    console.log(`❌ JSON parse error in ${fileName}`);
    return;
  }
  let changed = false;
  for (const q of data.questions) {
    if (q.question_type === 'multiselect') {
      // Ensure OPTION_E in options_pmp
      if (!q.options_pmp) q.options_pmp = {};
      if (!q.options_pmp.OPTION_E) {
        q.options_pmp.OPTION_E = 'Additional option for multiselect questions';
        changed = true;
      }
      // Ensure option_e_result
      if (!q.option_e_result) {
        q.option_e_result = 'INCORRECT - Placeholder for OPTION_E result.';
        changed = true;
      }
    } else {
      // Remove OPTION_E and option_e_result for non-multiselect
      if (q.options_pmp && q.options_pmp.OPTION_E) {
        delete q.options_pmp.OPTION_E;
        changed = true;
      }
      if (q.option_e_result) {
        delete q.option_e_result;
        changed = true;
      }
    }
  }
  if (changed) {
    // Write back to file
    const newJson = JSON.stringify(data, null, 2);
    const newContent = 'export const questionsData = ' + newJson + ';\n';
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`  ✅ Updated ${fileName}`);
  } else {
    console.log(`  ℹ️  No changes needed for ${fileName}`);
  }
});

console.log('\n✅ Process completed!'); 