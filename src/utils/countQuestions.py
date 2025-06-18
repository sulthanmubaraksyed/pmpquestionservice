import json
from pathlib import Path
import re

def count_questions_in_file(file_path: Path) -> int:
    """Count questions in a TypeScript file."""
    try:
        if not file_path.exists():
            print(f"Warning: File not found: {file_path}")
            return 0

        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read().strip()

        # Match export const questionsData = {...};
        match = re.search(r'export\s+const\s+questionsData\s*=\s*({[\s\S]*?});', content)
        if match:
            try:
                data = json.loads(match.group(1))
                questions = data.get("questions", [])
                return len(questions)
            except json.JSONDecodeError as e:
                print(f"Error parsing JSON in {file_path}: {str(e)}")
                return 0
        else:
            print(f"Warning: Could not find questionsData export in {file_path}")
            return 0
    except Exception as e:
        print(f"Error reading {file_path}: {str(e)}")
        return 0

def count_questions_in_json_file(filename: str) -> int:
    """Count questions in a specific JSON file in the loadFiles directory."""
    try:
        # Get the loadFiles directory path
        current_file = Path(__file__)
        utils_dir = current_file.parent
        load_files_dir = utils_dir / "loadFiles"
        file_path = load_files_dir / filename
        
        if not file_path.exists():
            print(f"Warning: File not found: {file_path}")
            return 0

        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        questions = data.get("questions", [])
        return len(questions)
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON in {filename}: {str(e)}")
        return 0
    except Exception as e:
        print(f"Error reading {filename}: {str(e)}")
        return 0

def count_all_questions(filename: str = None) -> int:
    """
    Count questions in all process group files or in a specific JSON file.
    
    Args:
        filename (str, optional): If provided, count questions in this specific JSON file.
                                 If None, count questions in all process group files.
    """
    if filename:
        # Count questions in a specific JSON file
        return count_questions_in_json_file(filename)
    else:
        # Count questions in all process group files
        # Get project root and questions directory
        project_root = Path(__file__).parent.parent.parent
        questions_dir = project_root / "src" / "questions"
        
        # Process group files
        process_group_files = {
            "Initiating": "in.ts",
            "Planning": "pl.ts",
            "Executing": "ex.ts",
            "Monitoring and Controlling": "mc.ts",
            "Closing": "cl.ts"
        }
        
        total_questions = 0
        print("\nQuestion Count by Process Group:")
        print("-" * 40)
        
        for process_group, filename in process_group_files.items():
            file_path = questions_dir / filename
            count = count_questions_in_file(file_path)
            print(f"{process_group} ({filename}): {count} questions")
            total_questions += count
        
        print("-" * 40)
        print(f"Total Questions: {total_questions}")
        return total_questions

if __name__ == "__main__":
    count_all_questions() 