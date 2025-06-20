const fs = require('fs');
const path = require('path');

function removeInvalidFromEx() {
    const filePath = path.join(__dirname, 'src', 'questions', 'ex.ts');
    
    console.log('=== Removing Invalid Questions from ex.ts ===\n');
    
    try {
        // Read the file
        const content = fs.readFileSync(filePath, 'utf8');
        console.log('File read successfully');
        
        // Extract the questions array using regex
        const questionsMatch = content.match(/export const questionsData = \{\s*"questions":\s*\[([\s\S]*?)\]\s*\};/);
        
        if (!questionsMatch) {
            console.error('Could not find questionsData export in ex.ts');
            return;
        }
        
        const questionsArrayText = questionsMatch[1];
        console.log('Questions array extracted');
        
        // Split the array into individual question objects (robust for nested braces)
        const questions = [];
        let current = '';
        let braceCount = 0;
        let inString = false;
        let escapeNext = false;
        
        for (let i = 0; i < questionsArrayText.length; i++) {
            const char = questionsArrayText[i];
            
            if (escapeNext) {
                current += char;
                escapeNext = false;
                continue;
            }
            
            if (char === '\\') {
                escapeNext = true;
                current += char;
                continue;
            }
            
            if (char === '"' && !escapeNext) {
                inString = !inString;
            }
            
            if (!inString) {
                if (char === '{') {
                    braceCount++;
                } else if (char === '}') {
                    braceCount--;
                }
            }
            
            current += char;
            
            if (braceCount === 0 && current.trim()) {
                const trimmed = current.trim();
                if (trimmed && trimmed !== ',') {
                    questions.push(trimmed);
                }
                current = '';
            }
        }
        
        console.log(`Found ${questions.length} question objects`);
        
        // Parse and filter questions
        let validCount = 0;
        let invalidCount = 0;
        const validQuestions = [];
        
        for (let i = 0; i < questions.length; i++) {
            let questionText = questions[i];
            
            try {
                if (questionText.endsWith(',')) {
                    questionText = questionText.slice(0, -1);
                }
                
                const question = JSON.parse(questionText);
                
                if (question.is_valid === true) {
                    validQuestions.push(questions[i]);
                    validCount++;
                } else {
                    invalidCount++;
                }
                
            } catch (e) {
                console.log(`Skipping malformed question ${i + 1}: ${e.message}`);
                // Keep malformed questions to avoid data loss
                validQuestions.push(questions[i]);
                validCount++;
            }
        }
        
        console.log(`Valid questions: ${validCount}`);
        console.log(`Invalid questions removed: ${invalidCount}`);
        
        // Reconstruct the file
        const beforeExport = content.substring(0, content.indexOf('export const questionsData'));
        const afterExport = content.substring(content.lastIndexOf('};') + 2);
        
        const newContent = beforeExport + 
            'export const questionsData = {\n' +
            '  "questions": [\n' +
            validQuestions.join(',\n') + '\n' +
            '  ]\n' +
            '};' +
            afterExport;
        
        // Write the file
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log('\n✅ ex.ts updated successfully!');
        console.log(`Removed ${invalidCount} invalid questions`);
        console.log(`Kept ${validCount} valid questions`);
        
    } catch (error) {
        console.error('Error processing ex.ts:', error.message);
    }
}

// Run the function
removeInvalidFromEx(); 