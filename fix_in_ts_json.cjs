const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'questions', 'in.ts');

console.log('Reading in.ts file...');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Fixing JSON structure...');

// Step 1: Add missing commas between question objects
// Look for patterns like "}\n\n{" and replace with "},\n\n{"
content = content.replace(/}\s*\n\s*{/g, '},\n\n{');

// Step 2: Remove duplicate OPTION fields that are outside options_pmp
// Remove lines like "OPTION_A": "...", "OPTION_B": "...", etc. that are not inside options_pmp
content = content.replace(/"OPTION_[A-D]":\s*"[^"]*",?\s*\n/g, '');

// Step 3: Remove duplicate option_a_result, option_b_result, etc. that are outside analysis
content = content.replace(/"option_[a-d]_result":\s*"[^"]*",?\s*\n/g, '');

// Step 4: Remove other duplicate fields that should only be in analysis
content = content.replace(/"process_group":\s*"[^"]*",?\s*\n/g, '');
content = content.replace(/"knowledge_area":\s*"[^"]*",?\s*\n/g, '');
content = content.replace(/"tool":\s*"[^"]*",?\s*\n/g, '');
content = content.replace(/"suggested_read":\s*"[^"]*",?\s*\n/g, '');
content = content.replace(/"concepts_to_understand":\s*"[^"]*",?\s*\n/g, '');

// Step 5: Clean up any trailing commas before closing braces
content = content.replace(/,(\s*})/g, '$1');

// Step 6: Clean up any trailing commas before closing brackets
content = content.replace(/,(\s*\])/g, '$1');

console.log('Writing fixed content back to file...');
fs.writeFileSync(filePath, content, 'utf8');

console.log('✅ Fixed JSON structure in in.ts');

// Verify the JSON is valid
try {
  // Extract the JSON part from the TypeScript export
  const jsonMatch = content.match(/export const questionsData = ({[\s\S]*});/);
  if (jsonMatch) {
    const jsonContent = jsonMatch[1];
    JSON.parse(jsonContent);
    console.log('✅ JSON validation passed');
  } else {
    console.log('❌ Could not extract JSON content');
  }
} catch (error) {
  console.log('❌ JSON validation failed:', error.message);
} 