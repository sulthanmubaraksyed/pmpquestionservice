const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'questions', 'pl.ts');
let data = fs.readFileSync(file, 'utf8');

// Find the start and end of the questions array
const start = data.indexOf('"questions": [');
const end = data.lastIndexOf(']');
if (start === -1 || end === -1) {
  console.error('Could not find questions array in pl.ts');
  process.exit(1);
}

const before = data.slice(0, start + '"questions": ['.length);
const arrText = data.slice(start + '"questions": ['.length, end);
const after = data.slice(end);

// Split into objects (naive, assumes no nested arrays)
const objects = arrText.split(/\n\s*\},\s*\{/g).map((obj, i, arr) => {
  if (i === 0) return obj + '}';
  if (i === arr.length - 1) return '{' + obj;
  return '{' + obj + '}';
});

// Filter only valid questions
const validObjects = objects.filter(obj => /"is_valid"\s*:\s*true/.test(obj));

// Rebuild the array
const newArrText = validObjects.join(',\n');
const newData = before + newArrText + after;

fs.writeFileSync(file, newData);
console.log('Filtered pl.ts: ' + validObjects.length + ' valid questions remain.'); 