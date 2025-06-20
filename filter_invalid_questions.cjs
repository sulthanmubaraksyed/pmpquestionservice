const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'questions', 'mc.ts');
let data = fs.readFileSync(file, 'utf8');

// Find the start and end of the questions array
const start = data.indexOf('"questions": [');
const end = data.lastIndexOf(']');
if (start === -1 || end === -1) {
  console.error('Could not find questions array in mc.ts');
  process.exit(1);
}

const before = data.slice(0, start + '"questions": ['.length);
const arrText = data.slice(start + '"questions": ['.length, end);
const after = data.slice(end);

// Split into objects (naive, assumes no nested arrays)
const objects = arrText.split('},').map((obj, index, arr) => {
  if (index === arr.length - 1) return obj;
  return obj + '}';
});

let validCount = 0;
let invalidCount = 0;
const validObjects = [];

for (const objText of objects) {
  let obj;
  try {
    obj = JSON.parse(objText.trim().replace(/,$/, ''));
  } catch (e) {
    // Try to fix trailing commas or other issues
    try {
      obj = eval('(' + objText.trim().replace(/,$/, '') + ')');
    } catch (e2) {
      console.warn('Skipping malformed object:', objText.slice(0, 100));
      continue;
    }
  }
  if (obj.is_valid === true) {
    validObjects.push(obj);
    validCount++;
  } else {
    invalidCount++;
  }
}

// Rebuild the file
const newArr = validObjects.map(q => JSON.stringify(q, null, 2)).join(',\n');
const newData = `${before}\n${newArr}\n${after}`;
fs.writeFileSync(file, newData, 'utf8');

console.log(`mc.ts cleaned: ${validCount} valid, ${invalidCount} invalid questions removed.`); 