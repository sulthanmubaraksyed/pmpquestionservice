import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function extractQuestionsFromFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const match = content.match(/export const questionsData = \{\s*"questions":\s*\[([\s\S]*?)\]\s*\};/);
    if (!match) {
      console.log(`No questions found in ${filePath}`);
      return { questions: [], prefix: '', suffix: '' };
    }
    const prefix = content.slice(0, match.index + match[0].indexOf('[') + 1);
    const suffix = content.slice(match.index + match[0].lastIndexOf(']') + 1);
    const questionsText = match[1];
    const questionObjects = [];
    let currentObject = '';
    let braceCount = 0;
    let inString = false;
    let escapeNext = false;
    for (let i = 0; i < questionsText.length; i++) {
      const char = questionsText[i];
      if (escapeNext) {
        currentObject += char;
        escapeNext = false;
        continue;
      }
      if (char === '\\') {
        escapeNext = true;
        currentObject += char;
        continue;
      }
      if (char === '"' && !escapeNext) {
        inString = !inString;
      }
      if (!inString) {
        if (char === '{') {
          if (braceCount === 0) {
            currentObject = '{';
          } else {
            currentObject += char;
          }
          braceCount++;
        } else if (char === '}') {
          currentObject += char;
          braceCount--;
          if (braceCount === 0) {
            try {
              const cleanObject = currentObject.trim();
              if (cleanObject.length > 2) {
                const parsedObject = eval('(' + cleanObject + ')');
                questionObjects.push({ obj: parsedObject, raw: cleanObject });
              }
            } catch (parseError) {
              console.log(`Error parsing object in ${filePath}:`, parseError.message);
            }
            currentObject = '';
          }
        } else if (braceCount > 0) {
          currentObject += char;
        }
      } else {
        currentObject += char;
      }
    }
    return { questions: questionObjects, prefix, suffix };
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return { questions: [], prefix: '', suffix: '' };
  }
}

function writeQuestionsToFile(filePath, prefix, validQuestions, suffix) {
  const joined = validQuestions.map(q => q.raw).join(',\n\n');
  const newContent = `${prefix}\n${joined}\n${suffix}`;
  fs.writeFileSync(filePath, newContent, 'utf8');
}

function deleteInvalidQuestions() {
  const questionsDir = path.join(__dirname, 'src', 'questions');
  const files = ['in.ts', 'pl.ts', 'ex.ts', 'mc.ts', 'cl.ts'];
  for (const file of files) {
    const filePath = path.join(questionsDir, file);
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${filePath}`);
      continue;
    }
    console.log(`\nProcessing ${file}...`);
    const { questions, prefix, suffix } = extractQuestionsFromFile(filePath);
    const validQuestions = questions.filter(q => q.obj.is_valid !== false);
    console.log(`  Original questions: ${questions.length}`);
    console.log(`  Valid questions kept: ${validQuestions.length}`);
    writeQuestionsToFile(filePath, prefix, validQuestions, suffix);
  }
  console.log('\nAll invalid questions removed from specified files.');
}

deleteInvalidQuestions(); 