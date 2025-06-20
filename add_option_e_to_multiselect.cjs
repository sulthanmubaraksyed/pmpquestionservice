const fs = require('fs');
const path = require('path');

const questionFiles = ['in.ts', 'pl.ts', 'ex.ts', 'mc.ts', 'cl.ts'];

console.log('Adding OPTION_E to multiselect questions...\n');

questionFiles.forEach(fileName => {
  const filePath = path.join(__dirname, 'src', 'questions', fileName);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${fileName}`);
    return;
  }
  
  console.log(`Processing ${fileName}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let multiselectCount = 0;
  
  // Find all questions with question_type: "multiselect"
  const multiselectRegex = /"question_type":\s*"multiselect"/g;
  const matches = content.match(multiselectRegex);
  
  if (matches) {
    multiselectCount = matches.length;
    console.log(`  Found ${multiselectCount} multiselect questions`);
  }
  
  // Pattern to find options_pmp objects that don't have OPTION_E
  // Look for options_pmp: { ... } where the closing } is followed by a comma or newline
  const optionsPmpRegex = /("options_pmp":\s*\{[^}]*\})/g;
  
  content = content.replace(optionsPmpRegex, (match, optionsPmp) => {
    // Check if this options_pmp already has OPTION_E
    if (optionsPmp.includes('"OPTION_E"')) {
      return match; // Already has OPTION_E, don't modify
    }
    
    // Find the position of the last option (OPTION_D)
    const lastOptionMatch = optionsPmp.match(/"OPTION_D":\s*"[^"]*"/);
    
    if (lastOptionMatch) {
      // Add OPTION_E after OPTION_D
      const beforeLastOption = optionsPmp.substring(0, lastOptionMatch.index + lastOptionMatch[0].length);
      const afterLastOption = optionsPmp.substring(lastOptionMatch.index + lastOptionMatch[0].length);
      
      // Find where to insert OPTION_E (before the closing brace)
      const closingBraceIndex = afterLastOption.indexOf('}');
      if (closingBraceIndex !== -1) {
        const beforeClosingBrace = afterLastOption.substring(0, closingBraceIndex);
        const afterClosingBrace = afterLastOption.substring(closingBraceIndex);
        
        // Add OPTION_E with proper formatting
        const optionE = ',\n      "OPTION_E": "Additional option for multiselect questions"';
        
        const newOptionsPmp = beforeLastOption + beforeClosingBrace + optionE + afterClosingBrace;
        modified = true;
        
        return newOptionsPmp;
      }
    }
    
    return match; // No modification if pattern doesn't match
  });
  
  if (modified) {
    // Write the modified content back to the file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  ✅ Added OPTION_E to multiselect questions in ${fileName}`);
  } else {
    console.log(`  ℹ️  No changes needed for ${fileName}`);
  }
});

console.log('\n✅ Process completed!');
console.log('\nNote: OPTION_E has been added with placeholder text "Additional option for multiselect questions"');
console.log('You may want to update the actual OPTION_E text for each question as needed.'); 