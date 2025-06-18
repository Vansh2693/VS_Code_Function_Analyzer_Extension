import os
import sys
import json
import ast
from typing import Dict, List, Tuple
from pathlib import Path


class PythonFunctionAnalyzer:
    """
    Analyzer class that handles Python file scanning and function counting
    Follows OOP principles with clear method separation
    Now supports both regular (def) and async (async def) functions
    """
    
    def __init__(self, root_directory: str):
        """
        Initialize the analyzer with a root directory
        
        Args:
            root_directory: Path to the directory to analyze
        """
        self.root_directory = Path(root_directory).resolve()
        self.function_counts: Dict[str, Dict[str, int]] = {}
    
    def analyze_directory(self) -> Dict[str, Dict[str, int]]:
        """
        Main method to analyze all Python files in the directory
        
        Returns:
            Dictionary mapping file paths to function count details
            Format: {file_path: {"total": int, "sync": int, "async": int}}
        """
        try:
            # Find all Python files recursively
            python_files = self._find_python_files()
            
            # Analyze each file
            for file_path in python_files:
                function_details = self._count_functions_in_file(file_path)
                self.function_counts[str(file_path)] = function_details
            
            return self.function_counts
            
        except Exception as e:
            return {"error": str(e), "file_counts": {}}
    
    def _find_python_files(self) -> List[Path]:
        """
        Recursively find all Python files in the directory
        
        Returns:
            List of Path objects for Python files
        """
        python_files = []
        
        try:
            for file_path in self.root_directory.rglob("*.py"):
                if file_path.is_file():
                    python_files.append(file_path)
        except (OSError, PermissionError) as e:
            print(f"Warning: Could not access some files: {e}", file=sys.stderr)
        
        return sorted(python_files)  # Sort for consistent output
    
    def _count_functions_in_file(self, file_path: Path) -> Dict[str, int]:
        """
        Count top-level function definitions (both sync and async) in a Python file
        
        Args:
            file_path: Path to the Python file to analyze
            
        Returns:
            Dictionary with function count details: {"total": int, "sync": int, "async": int}
        """
        try:
            # Read file content
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as file:
                content = file.read()
            
            # Parse the Python code into an AST
            tree = ast.parse(content)
            
            # Count top-level function definitions (both sync and async)
            sync_count, async_count = self._analyze_functions_in_tree(tree)
            total_count = sync_count + async_count
            
            return {
                "total": total_count,
                "sync": sync_count,
                "async": async_count
            }
            
        except (SyntaxError, UnicodeDecodeError) as e:
            # Handle files with syntax errors or encoding issues
            print(f"Warning: Could not parse {file_path}: {e}", file=sys.stderr)
            return {"total": 0, "sync": 0, "async": 0}
        except Exception as e:
            # Handle any other unexpected errors
            print(f"Error analyzing {file_path}: {e}", file=sys.stderr)
            return {"total": 0, "sync": 0, "async": 0}
    
    def _analyze_functions_in_tree(self, tree: ast.AST) -> Tuple[int, int]:
        """
        Analyze the AST tree to count sync and async functions
        
        Args:
            tree: The complete AST tree
            
        Returns:
            Tuple of sync_count, async_count
        """
        sync_count = 0
        async_count = 0
        
        for node in ast.walk(tree):
            # Check for regular function definitions (def)
            if isinstance(node, ast.FunctionDef):
                if self._is_top_level_function(node, tree):
                    sync_count += 1
            
            # Check for async function definitions (async def)
            elif isinstance(node, ast.AsyncFunctionDef):
                if self._is_top_level_function(node, tree):
                    async_count += 1
        
        return sync_count, async_count
    
    def _is_top_level_function(self, func_node, tree: ast.AST) -> bool:
        """
        Check if a function definition is at the top level (not nested)
        Now supports both FunctionDef and AsyncFunctionDef nodes
        
        Args:
            func_node: The function definition node (FunctionDef or AsyncFunctionDef)
            tree: The complete AST tree
            
        Returns:
            True if the function is top-level, False otherwise
        """
        # Find all parent nodes
        for node in ast.walk(tree):
            for child in ast.iter_child_nodes(node):
                if child is func_node:
                    return isinstance(node, ast.Module)
        
        return False


def main():
    if len(sys.argv) != 2:
        print(json.dumps({
            "error": "Usage: python analyze_functions.py <directory_path>",
            "file_counts": {}
        }))
        sys.exit(1)
    
    directory_path = sys.argv[1]
    
    # Validate if directory exists
    if not os.path.isdir(directory_path):
        print(json.dumps({
            "error": f"Directory not found: {directory_path}",
            "file_counts": {}
        }))
        sys.exit(1)
    
    # Perform analysis
    analyzer = PythonFunctionAnalyzer(directory_path)
    results = analyzer.analyze_directory()
    
    # Calculate summary statistics
    total_functions = 0
    total_sync = 0
    total_async = 0
    
    for file_data in results.values():
        if isinstance(file_data, dict) and "total" in file_data:
            total_functions += file_data["total"]
            total_sync += file_data["sync"]
            total_async += file_data["async"]
    
    # Output results as JSON 
    output = {
        "file_counts": results,
        "total_files": len(results),
        "analysis_path": directory_path,
        "summary": {
            "total_functions": total_functions,
            "sync_functions": total_sync,
            "async_functions": total_async
        }
    }
    
    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()