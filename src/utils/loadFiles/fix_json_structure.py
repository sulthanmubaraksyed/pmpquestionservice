import json
import re

input_path = 'src/utils/loadFiles/load_DEfineScope_ImplementRiskResponse_ControlCost_v1.json'
output_path = 'src/utils/loadFiles/load_DEfineScope_ImplementRiskResponse_ControlCost_v1.fixed.json'

with open(input_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find all questions arrays in the file
questions_blocks = re.findall(r'"questions"\s*:\s*\[(.*?)\]\s*[,}]', content, re.DOTALL)

all_questions = []
for block in questions_blocks:
    # Add brackets to make it a valid array
    try:
        questions = json.loads(f'[{block}]')
        all_questions.extend(questions)
    except Exception as e:
        print('Error parsing block:', e)

# Write out a single valid JSON object
fixed = {
    "questions": all_questions
}

with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(fixed, f, indent=2, ensure_ascii=False)

print(f'Fixed JSON written to {output_path} with {len(all_questions)} questions.') 