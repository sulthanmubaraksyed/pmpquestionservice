#!/usr/bin/env python3
"""
imPromptWithDifficulty.py - Process question data and generate JSON output without difficulty_level
"""

import json
import os
import re
from pathlib import Path
from typing import Dict, List, Any

def load_questions_from_file(file_path: str) -> Dict[str, Any]:
    """Load questions from a JSON or TypeScript file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read().strip()
        
        # Handle TypeScript files
        if file_path.endswith('.ts'):
            # Remove export statement if present
            if content.startswith('export const questionsData = '):
                content = content.replace('export const questionsData = ', '', 1)
                if content.endswith(';'):
                    content = content[:-1]
            elif content.startswith('export const'):
                # Handle other export patterns
                content = re.sub(r'^export const \w+ = ', '', content)
                if content.endswith(';'):
                    content = content[:-1]
        
        # Parse JSON
        data = json.loads(content)
        return data
    except json.JSONDecodeError as e:
        print(f"JSON decode error in {file_path}: {e}")
        return {}
    except Exception as e:
        print(f"Error loading file {file_path}: {e}")
        return {}

def remove_difficulty_level(question: Dict[str, Any]) -> Dict[str, Any]:
    """Remove difficulty_level field from a question."""
    # Create a copy of the question to avoid modifying the original
    cleaned_question = question.copy()
    if 'difficulty_level' in cleaned_question:
        del cleaned_question['difficulty_level']
    return cleaned_question

def process_questions(data: Dict[str, Any]) -> Dict[str, Any]:
    """Process questions and remove difficulty_level from all questions."""
    if 'questions' in data and isinstance(data['questions'], list):
        processed_questions = []
        for i, question in enumerate(data['questions']):
            if isinstance(question, dict):
                processed_question = remove_difficulty_level(question)
                processed_questions.append(processed_question)
            else:
                print(f"Warning: Question {i} is not a dictionary, skipping...")
                processed_questions.append(question)
        
        # Create new data structure without difficulty_level
        processed_data = {
            'is_sample': data.get('is_sample', False),
            'questions': processed_questions
        }
        return processed_data
    else:
        print(f"Warning: No 'questions' array found in data")
        return data

def save_processed_data(data: Dict[str, Any], output_file: str) -> bool:
    """Save processed data to a JSON file."""
    try:
        # Create output directory if it doesn't exist
        output_path = Path(output_file)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"✅ Processed data saved to {output_file}")
        return True
    except Exception as e:
        print(f"Error saving file {output_file}: {e}")
        return False

def validate_processed_data(data: Dict[str, Any]) -> bool:
    """Validate that difficulty_level has been removed from all questions."""
    if 'questions' not in data:
        return True
    
    for i, question in enumerate(data['questions']):
        if isinstance(question, dict) and 'difficulty_level' in question:
            print(f"❌ Error: difficulty_level still present in question {i}")
            return False
    
    print("✅ Validation passed: All difficulty_level fields removed")
    return True

def main():
    """Main function to process question files."""
    # Define input and output files
    input_files = [
        "src/utils/loadFiles/load_Questions.json",
        "src/questions/ex.ts",
        "src/questions/mc.ts",
        "src/questions/pl.ts",
        "src/questions/cl.ts",
        "src/questions/in.ts"
    ]
    
    processed_count = 0
    total_count = 0
    
    for input_file in input_files:
        total_count += 1
        if os.path.exists(input_file):
            print(f"\nProcessing {input_file}...")
            
            # Load the data
            data = load_questions_from_file(input_file)
            if not data:
                print(f"❌ Failed to load {input_file}")
                continue
            
            # Process the questions (remove difficulty_level)
            processed_data = process_questions(data)
            
            # Validate the processed data
            if not validate_processed_data(processed_data):
                print(f"❌ Validation failed for {input_file}")
                continue
            
            # Generate output filename
            base_name = Path(input_file).stem
            output_file = f"processed_{base_name}.json"
            
            # Save the processed data
            if save_processed_data(processed_data, output_file):
                print(f"✅ Successfully processed {input_file} -> {output_file}")
                processed_count += 1
            else:
                print(f"❌ Failed to save processed data for {input_file}")
        else:
            print(f"⚠️  File not found: {input_file}")
    
    print(f"\n📊 Summary: Processed {processed_count}/{total_count} files successfully")

if __name__ == "__main__":
    main() 