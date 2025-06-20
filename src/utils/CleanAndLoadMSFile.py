import os
from pathlib import Path
import logging
from typing import Dict, Any, List, Tuple
import sys

# Import the required utility functions
from fixJsonStructure import fix_json_file
from generateUUIDForAllRecords import generateUUIDForAllRecords
from getUniqueQuestionsMS import getUniqueQuestionsMS
from countQuestions import count_all_questions

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_load_files_dir() -> Path:
    """
    Returns the absolute path to the loadFiles directory.
    """
    current_file = Path(__file__)
    utils_dir = current_file.parent
    return utils_dir / "loadFiles"

def cleanAndLoadMSFile(filename: str) -> Tuple[bool, Dict[str, Any]]:
    """
    Orchestrates the cleaning and loading of a file through multiple processing steps.
    This version is specifically for Multiple Select (MS) questions that have exactly 3 correct options.
    
    Args:
        filename (str): Name of the file in loadFiles directory (e.g., 'load_AcquireResource.json')
        
    Returns:
        Tuple[bool, Dict[str, Any]]: 
            - bool: True if all operations were successful, False otherwise
            - Dict[str, Any]: Summary of operations performed and their results
    """
    try:
        # Initialize results dictionary
        results = {
            "filename": filename,
            "operations": {},
            "success": False,
            "error": None,
            "records_added": {},
            "total_records_processed": 0,
            "valid_records": 0,
            "invalid_records": 0
        }
        
        print(f"\n{'='*60}")
        print(f"PROCESSING FILE: {filename}")
        print(f"{'='*60}")
        
        # Step 1: Fix JSON Structure
        print(f"\n📝 Step 1: Fixing JSON structure for {filename}")
        json_fix_success = fix_json_file(filename)
        results["operations"]["fix_json_structure"] = {
            "success": json_fix_success,
            "message": "JSON structure fixed successfully" if json_fix_success else "Failed to fix JSON structure"
        }
        if not json_fix_success:
            raise Exception("Failed to fix JSON structure")
        print("✅ JSON structure fixed successfully")
        
        # Step 2: Generate UUIDs for all records
        print(f"\n🆔 Step 2: Generating UUIDs for {filename}")
        try:
            generateUUIDForAllRecords(filename)
            results["operations"]["generate_uuids"] = {
                "success": True,
                "message": "UUIDs generated successfully"
            }
            print("✅ UUIDs generated successfully")
        except Exception as e:
            results["operations"]["generate_uuids"] = {
                "success": False,
                "message": f"Failed to generate UUIDs: {str(e)}"
            }
            raise Exception(f"Failed to generate UUIDs: {str(e)}")
        
        # Step 3: Get unique questions (MS version)
        print(f"\n🔍 Step 3: Processing unique MS questions for {filename}")
        try:
            # Capture the output from getUniqueQuestionsMS
            import io
            import sys
            from contextlib import redirect_stdout
            
            # Capture stdout to get detailed output
            output_capture = io.StringIO()
            with redirect_stdout(output_capture):
                unique_questions = getUniqueQuestionsMS(filename)
            
            # Get the captured output
            captured_output = output_capture.getvalue()
            print(captured_output)
            
            # Parse the output to extract statistics
            lines = captured_output.split('\n')
            total_read = 0
            validated = 0
            invalid = 0
            added_by_pg = {}
            
            for line in lines:
                if "Total questions read:" in line:
                    total_read = int(line.split(':')[1].strip())
                elif "Valid questions:" in line:
                    validated = int(line.split(':')[1].strip())
                elif "Invalid questions:" in line:
                    invalid = int(line.split(':')[1].strip())
                elif ":" in line and any(pg in line for pg in ["Initiating", "Planning", "Executing", "Monitoring and Controlling", "Closing"]):
                    parts = line.split(':')
                    if len(parts) == 2:
                        pg = parts[0].strip()
                        count = int(parts[1].strip())
                        if count > 0:
                            added_by_pg[pg] = count
            
            results["operations"]["get_unique_questions"] = {
                "success": True,
                "message": "Unique MS questions processed successfully",
                "total_read": total_read,
                "validated": validated,
                "invalid": invalid,
                "added_by_process_group": added_by_pg
            }
            
            results["total_records_processed"] = total_read
            results["valid_records"] = validated
            results["invalid_records"] = invalid
            results["records_added"] = added_by_pg
            
            print(f"✅ Unique MS questions processed successfully")
            print(f"   📊 Total read: {total_read}")
            print(f"   ✅ Valid: {validated}")
            print(f"   ❌ Invalid: {invalid}")
            
        except Exception as e:
            results["operations"]["get_unique_questions"] = {
                "success": False,
                "message": f"Failed to process unique MS questions: {str(e)}"
            }
            print(f"❌ Failed to process unique MS questions: {str(e)}")
            raise Exception(f"Failed to process unique MS questions: {str(e)}")
        
        # Step 4: Count questions
        print(f"\n📊 Step 4: Counting questions in {filename}")
        try:
            count_result = count_all_questions(filename)
            results["operations"]["count_questions"] = {
                "success": True,
                "message": "Questions counted successfully",
                "count": count_result
            }
            print(f"✅ Questions counted successfully: {count_result}")
        except Exception as e:
            results["operations"]["count_questions"] = {
                "success": False,
                "message": f"Failed to count questions: {str(e)}"
            }
            print(f"❌ Failed to count questions: {str(e)}")
            raise Exception(f"Failed to count questions: {str(e)}")
        
        # If we got here, all operations were successful
        results["success"] = True
        print(f"\n{'='*60}")
        print(f"🎉 SUCCESS: {filename} processed successfully!")
        print(f"{'='*60}")
        return True, results
        
    except Exception as e:
        error_msg = f"Error processing {filename}: {str(e)}"
        logger.error(error_msg)
        results["success"] = False
        results["error"] = error_msg
        print(f"\n{'='*60}")
        print(f"❌ ERROR: {error_msg}")
        print(f"{'='*60}")
        return False, results

def print_operation_summary(results: Dict[str, Any]):
    """Print a detailed summary of the operations performed"""
    print(f"\n{'='*60}")
    print("DETAILED OPERATION SUMMARY")
    print(f"{'='*60}")
    print(f"📁 File: {results['filename']}")
    print(f"🎯 Overall Status: {'✅ Success' if results['success'] else '❌ Failed'}")
    
    if results['error']:
        print(f"\n❌ Error: {results['error']}")
    
    print(f"\n📊 Processing Statistics:")
    print(f"   Total records processed: {results.get('total_records_processed', 0)}")
    print(f"   Valid records: {results.get('valid_records', 0)}")
    print(f"   Invalid records: {results.get('invalid_records', 0)}")
    
    if results.get('records_added'):
        print(f"\n📝 Records Added by Process Group:")
        for pg, count in results['records_added'].items():
            print(f"   ✅ {pg}: {count} records")
    
    print(f"\n🔧 Operations Performed:")
    for op_name, op_result in results['operations'].items():
        status = "✅" if op_result['success'] else "❌"
        print(f"{status} {op_name}: {op_result['message']}")
        
        # Print additional details for get_unique_questions
        if op_name == "get_unique_questions" and op_result['success']:
            if 'total_read' in op_result:
                print(f"   📊 Total read: {op_result['total_read']}")
            if 'validated' in op_result:
                print(f"   ✅ Valid: {op_result['validated']}")
            if 'invalid' in op_result:
                print(f"   ❌ Invalid: {op_result['invalid']}")
            if 'added_by_process_group' in op_result:
                for pg, count in op_result['added_by_process_group'].items():
                    print(f"   📝 {pg}: {count} records")
        
        # Print count for count_questions
        if op_name == "count_questions" and 'count' in op_result:
            print(f"   📊 Count: {op_result['count']}")
    
    print(f"{'='*60}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python CleanAndLoadMSFile.py <filename>")
        print("Example: python CleanAndLoadMSFile.py load_AcquireResource.json")
        sys.exit(1)
    
    filename = sys.argv[1]
    success, results = cleanAndLoadMSFile(filename)
    print_operation_summary(results)
    sys.exit(0 if success else 1) 