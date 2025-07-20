"""
Enhanced formula evaluation engine with dependency graph and topological sorting.
"""

import re
import logging
from typing import Dict, List, Any, Union, Tuple, Set
from dependency_graph import DependencyGraph, CellRef, FormulaNode
from formula_parser import FormulaParser

logger = logging.getLogger(__name__)


class EnhancedFormulaEngine:
    """Enhanced formula evaluation engine with dependency graph management."""
    
    def __init__(self):
        self.dependency_graph = DependencyGraph()
        self.formula_parser = FormulaParser()
        self.circular_dependency_errors = {}
        self.functions = {
            'SUM': self._calculate_sum,
            'AVERAGE': self._calculate_average,
            'MIN': self._calculate_min,
            'MAX': self._calculate_max,
            'COUNT': self._calculate_count,
        }
        self._data_context = []
        self._columns_context = []
    
    def _format_number(self, value: Union[float, int, str]) -> str:
        """Format numerical values to display as integers when possible, floats otherwise."""
        if isinstance(value, (int, float)):
            # Check if it's a whole number
            if isinstance(value, float) and value.is_integer():
                return str(int(value))
            elif isinstance(value, int):
                return str(value)
            else:
                # It's a float with decimal places
                return str(value)
        return str(value)
    
    def evaluate_formulas(self, data: List[Dict], columns: List[Dict]) -> Dict[str, Any]:
        """Evaluate all formulas in the dataset using dependency graph."""
        try:
            # Store context for evaluation
            self._data_context = data.copy()
            self._columns_context = columns.copy()
            
            # Step 1: Build dependency graph
            self._build_dependency_graph(data, columns)
            
            # Step 2: Check for circular dependencies
            has_cycles, cycle_path = self.dependency_graph.has_circular_dependency()
            if has_cycles:
                cycle_str = ' -> '.join(str(cell) for cell in cycle_path) if cycle_path else 'Unknown'
                logger.error(f"Circular dependency detected: {cycle_str}")
                
                # Mark all cells in cycle with error
                cycle_errors = {}
                if cycle_path:
                    for cell_ref in cycle_path:
                        row_index = cell_ref.row - 1
                        column_key = cell_ref.column
                        if 0 <= row_index < len(data):
                            cell_key = f"{row_index}-{column_key}"
                            cycle_errors[cell_key] = f"Circular dependency: {cycle_str}"
                
                return {
                    'success': False,
                    'error': f"Circular dependency detected: {cycle_str}",
                    'message': 'Circular dependencies must be resolved before evaluation',
                    'cell_errors': cycle_errors,
                    'data': data  # Return original data
                }
            
            # Step 3: Get topological evaluation order
            evaluation_order = self.dependency_graph.get_evaluation_order()
            logger.info(f"Evaluating {len(evaluation_order)} formulas in dependency order")
            
            # Step 4: Evaluate formulas in order
            new_data = [row.copy() for row in data]
            evaluation_stats = {'evaluated': 0, 'errors': 0, 'cached': 0}
            cell_errors = {}  # Track individual cell errors
            
            for cell_ref in evaluation_order:
                try:
                    node = self.dependency_graph.nodes[cell_ref]
                    
                    # Skip if already evaluated
                    if node.is_evaluated:
                        evaluation_stats['cached'] += 1
                        continue
                    
                    # Get the row and column
                    row_index = cell_ref.row - 1  # Convert to 0-based index
                    column_key = self._letter_to_column_key(cell_ref.column, columns)
                    
                    if row_index < 0 or row_index >= len(new_data) or not column_key:
                        logger.warning(f"Invalid cell reference: {cell_ref}")
                        cell_key = f"{row_index}-{cell_ref.column}"
                        cell_errors[cell_key] = "Invalid cell reference"
                        continue
                    
                    # Evaluate the formula
                    result = self._evaluate_formula(
                        node.formula, row_index, column_key, new_data, columns
                    )
                    
                    # Create cell key for error tracking
                    cell_key = f"{row_index}-{column_key}"
                    
                    # Update the result in data
                    if isinstance(result, str) and result.startswith('#'):
                        # Error result
                        new_data[row_index][column_key] = result
                        self.dependency_graph.mark_cell_evaluated(cell_ref, result, has_error=True, error_message=result)
                        cell_errors[cell_key] = result
                        evaluation_stats['errors'] += 1
                    else:
                        # Success result
                        new_data[row_index][column_key] = self._format_number(result) if result is not None else '0'
                        self.dependency_graph.mark_cell_evaluated(cell_ref, result, has_error=False)
                        evaluation_stats['evaluated'] += 1
                    
                    logger.debug(f"Evaluated {cell_ref}: {node.formula} = {result}")
                    
                except Exception as e:
                    logger.error(f"Error evaluating formula for cell {cell_ref}: {str(e)}")
                    row_index = cell_ref.row - 1
                    column_key = self._letter_to_column_key(cell_ref.column, columns)
                    cell_key = f"{row_index}-{column_key}" if column_key else f"{row_index}-{cell_ref.column}"
                    
                    if row_index < len(new_data) and column_key:
                        new_data[row_index][column_key] = '#ERROR!'
                        self.dependency_graph.mark_cell_evaluated(cell_ref, '#ERROR!', has_error=True, error_message=str(e))
                    
                    cell_errors[cell_key] = str(e)
                    evaluation_stats['errors'] += 1
            
            # Get graph statistics
            graph_stats = self.dependency_graph.get_graph_stats()
            
            # Merge circular dependency errors with evaluation errors
            all_cell_errors = {**self.circular_dependency_errors, **cell_errors}
            
            return {
                'success': True,
                'data': new_data,
                'message': f'Evaluated {evaluation_stats["evaluated"]} formulas successfully',
                'cell_errors': all_cell_errors,  # Include both circular dependency and evaluation errors
                'stats': {
                    'evaluation': evaluation_stats,
                    'graph': graph_stats,
                    'evaluation_order': [str(cell) for cell in evaluation_order]
                }
            }
            
        except Exception as e:
            logger.error(f"Error in evaluate_formulas: {str(e)}")
            # Include any circular dependency errors that were detected before the exception
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to evaluate formulas',
                'cell_errors': getattr(self, 'circular_dependency_errors', {}),
                'data': data
            }
    
    def _build_dependency_graph(self, data: List[Dict], columns: List[Dict]):
        try:
            self.dependency_graph = DependencyGraph()
            self.circular_dependency_errors = {}  # Track circular dependency errors
            
            for row_index, row in enumerate(data):
                for column in columns:
                    cell_value = row.get(column['key'], '')
                    if isinstance(cell_value, str) and cell_value.startswith('='):
                        cell_ref = CellRef(column['key'], row_index + 1)
                        dependencies = self.formula_parser.extract_dependencies(cell_value)
                        # Map dependencies to actual column keys
                        mapped_dependencies = set()
                        for dep in dependencies:
                            mapped_key = self._letter_to_column_key(dep.column, columns)
                            if mapped_key:
                                mapped_dependencies.add(CellRef(mapped_key, dep.row))
                        valid_dependencies = self._validate_dependencies(mapped_dependencies, data, columns)
                        success = self.dependency_graph.add_formula(cell_ref, cell_value, valid_dependencies)
                        print(f"Adding formula {cell_value} for cell {cell_ref} with dependencies {valid_dependencies}")
                        if not success:
                            logger.warning(f"Failed to add formula {cell_value} for cell {cell_ref}")
                            # Track the circular dependency error for frontend
                            cell_key = f"{row_index}-{column['key']}"
                            self.circular_dependency_errors[cell_key] = "Circular dependency detected"
                            
            logger.info(f"Built dependency graph with {len(self.dependency_graph.nodes)} formula nodes")
        except Exception as e:
            logger.error(f"Error building dependency graph: {str(e)}")
            raise

    def _find_column_by_letter(self, letter: str, columns_context: List[Dict]) -> Dict:
        """Find column definition by Excel-style letter (A, B, ...)."""
        # With the new system, the letter IS the column key
        for column in columns_context:
            if column.get('key') == letter:
                return column
        return None

    def _letter_to_column_key(self, letter: str, columns_context: List[Dict]) -> str:
        """Map Excel-style column letter to the actual column key."""
        # With the new system, the letter IS the column key
        for column in columns_context:
            if column.get('key') == letter:
                return column['key']
        return None
    
    def _validate_dependencies(self, dependencies: Set[CellRef], 
                             data: List[Dict], columns: List[Dict]) -> Set[CellRef]:
        """Validate that all dependencies exist in the current data."""
        valid_deps = set()
        
        for dep in dependencies:
            # Check if row exists
            if dep.row < 1 or dep.row > len(data):
                logger.warning(f"Dependency {dep} references non-existent row")
                continue
            
            # Check if column exists
            column_key = self._letter_to_column_key
            if not column_key:
                logger.warning(f"Dependency {dep} references non-existent column")
                continue
            
            valid_deps.add(dep)
        
        return valid_deps
    
    def get_dependency_graph_info(self) -> Dict[str, Any]:
        """Get information about the current dependency graph."""
        return {
            'stats': self.dependency_graph.get_graph_stats(),
            'evaluation_order': [str(cell) for cell in self.dependency_graph.get_evaluation_order()],
            'dirty_cells': [str(cell) for cell in self.dependency_graph.get_dirty_cells()],
            'has_cycles': self.dependency_graph.has_circular_dependency()[0]
        }
    
    # Include all the helper methods from the original engine
    def _evaluate_formula(self, formula: str, current_row: int, current_col: str, 
                         data_context: List[Dict], columns_context: List[Dict]) -> Union[float, str]:
        """Evaluate a single formula (same logic as original engine)."""
        try:
            # Remove the = sign and convert to uppercase
            expression = formula[1:].upper().strip()
            
            if not expression:
                return '#ERROR!'
            
            # Handle function calls (SUM, AVERAGE, etc.)
            func_match = re.match(r'([A-Z]+)\(([^)]+)\)', expression)
            if func_match:
                func_name, args = func_match.groups()
                if func_name in self.functions:
                    return self.functions[func_name](args, current_row, data_context, columns_context)
                else:
                    return f'#NAME?'  # Unknown function
            
            # Handle cell references (A1, B2, etc.)
            cell_ref_match = re.match(r'^([A-Z]+)(\d+)$', expression)
            if cell_ref_match:
                col_ref, row_ref = cell_ref_match.groups()
                return self._get_cell_value(col_ref, int(row_ref) - 1, data_context, columns_context)
            
            # Handle arithmetic expressions (A1+B1, A1*2, etc.)
            arithmetic_match = re.match(r'^(.+?)([\+\-\*\/])(.+?)$', expression)
            if arithmetic_match:
                left, operator, right = arithmetic_match.groups()
                left_value = self._parse_value(left.strip(), current_row, data_context, columns_context)
                right_value = self._parse_value(right.strip(), current_row, data_context, columns_context)
                
                return self._perform_arithmetic(left_value, operator, right_value)
            
            # Try to parse as a number
            try:
                return float(expression)
            except ValueError:
                return '#ERROR!'
                
        except Exception as e:
            logger.error(f"Error evaluating formula '{formula}': {str(e)}")
            return '#ERROR!'
    
    # Copy helper methods from original formula_engine.py
    def _calculate_sum(self, args_str: str, current_row: int, 
                      data_context: List[Dict], columns_context: List[Dict]) -> Union[float, str]:
        """Calculate SUM for ranges like A1:A5 or comma-separated values like A1,B1,C1"""
        try:
            args_str = args_str.strip()
            
            # Check if it's a range (A1:A5 or A1:C1)
            range_match = re.match(r'^([A-Z]+)(\d+):([A-Z]+)(\d+)$', args_str)
            if range_match:
                start_col, start_row, end_col, end_row = range_match.groups()
                start_row_idx = int(start_row) - 1
                end_row_idx = int(end_row) - 1
                
                total = 0
                
                # Convert column letters to indices
                start_col_idx = ord(start_col) - ord('A')
                end_col_idx = ord(end_col) - ord('A')
                
                # Iterate through all cells in the range
                for row_idx in range(start_row_idx, min(end_row_idx + 1, len(data_context))):
                    if row_idx >= 0:
                        for col_idx in range(start_col_idx, end_col_idx + 1):
                            col_letter = chr(ord('A') + col_idx)
                            value = self._get_cell_value(col_letter, row_idx, data_context, columns_context)
                            total += value
                
                return total
            
            # Handle comma-separated values (A1,B1,C1)
            if ',' in args_str:
                total = 0
                cell_refs = [ref.strip() for ref in args_str.split(',')]
                for cell_ref in cell_refs:
                    cell_match = re.match(r'^([A-Z]+)(\d+)$', cell_ref)
                    if cell_match:
                        col_ref, row_ref = cell_match.groups()
                        row_idx = int(row_ref) - 1
                        value = self._get_cell_value(col_ref, row_idx, data_context, columns_context)
                        total += value
                    else:
                        # Try to parse as a number
                        try:
                            total += float(cell_ref)
                        except ValueError:
                            logger.error(f"Invalid cell reference or number: {cell_ref}")
                            return '#ERROR!'
                
                return total
            
            # Single cell reference
            cell_match = re.match(r'^([A-Z]+)(\d+)$', args_str)
            if cell_match:
                col_ref, row_ref = cell_match.groups()
                row_idx = int(row_ref) - 1
                return self._get_cell_value(col_ref, row_idx, data_context, columns_context)
            
            # Try to parse as a number
            try:
                return float(args_str)
            except ValueError:
                logger.error(f"Invalid SUM argument: {args_str}")
                return '#ERROR!'
            
        except Exception as e:
            logger.error(f"Error in _calculate_sum: {str(e)}")
            return '#ERROR!'
    
    def _calculate_average(self, args_str: str, current_row: int,
                          data_context: List[Dict], columns_context: List[Dict]) -> Union[float, str]:
        """Calculate AVERAGE for ranges like A1:A5 or comma-separated values like A1,B1,C1"""
        try:
            args_str = args_str.strip()
            
            # Check if it's a range (A1:A5 or A1:C1)
            range_match = re.match(r'^([A-Z]+)(\d+):([A-Z]+)(\d+)$', args_str)
            if range_match:
                sum_result = self._calculate_sum(args_str, current_row, data_context, columns_context)
                if isinstance(sum_result, str):  # Error occurred
                    return sum_result
                
                start_col, start_row, end_col, end_row = range_match.groups()
                # Calculate the number of cells in the range
                start_col_idx = ord(start_col) - ord('A')
                end_col_idx = ord(end_col) - ord('A')
                start_row_idx = int(start_row)
                end_row_idx = int(end_row)
                
                num_cols = end_col_idx - start_col_idx + 1
                num_rows = end_row_idx - start_row_idx + 1
                count = num_cols * num_rows
                
                return sum_result / count if count > 0 else '#DIV/0!'
            
            # Handle comma-separated values (A1,B1,C1)
            if ',' in args_str:
                sum_result = self._calculate_sum(args_str, current_row, data_context, columns_context)
                if isinstance(sum_result, str):  # Error occurred
                    return sum_result
                
                cell_refs = [ref.strip() for ref in args_str.split(',')]
                count = len(cell_refs)
                return sum_result / count if count > 0 else '#DIV/0!'
            
            # Single cell reference
            cell_match = re.match(r'^([A-Z]+)(\d+)$', args_str)
            if cell_match:
                return self._calculate_sum(args_str, current_row, data_context, columns_context)
            
            # Try to parse as a number
            try:
                return float(args_str)
            except ValueError:
                logger.error(f"Invalid AVERAGE argument: {args_str}")
                return '#ERROR!'
            
        except Exception as e:
            logger.error(f"Error in _calculate_average: {str(e)}")
            return '#ERROR!'
    
    def _calculate_min(self, range_str: str, current_row: int,
                      data_context: List[Dict], columns_context: List[Dict]) -> Union[float, str]:
        """Calculate MIN for a range"""
        try:
            range_match = re.match(r'^([A-Z]+)(\d+):([A-Z]+)(\d+)$', range_str.strip())
            if not range_match:
                return '#ERROR!'
            
            start_col, start_row, end_col, end_row = range_match.groups()
            start_row_idx = int(start_row) - 1
            end_row_idx = int(end_row) - 1
            
            column = self._find_column_by_letter(start_col, columns_context)
            if not column:
                return '#ERROR!'
            
            values = []
            for i in range(start_row_idx, min(end_row_idx + 1, len(data_context))):
                if i >= 0:
                    value = self._get_numeric_value(data_context[i].get(column['key'], 0))
                    values.append(value)
            
            return min(values) if values else 0
            
        except Exception as e:
            logger.error(f"Error in _calculate_min: {str(e)}")
            return '#ERROR!'
    
    def _calculate_max(self, range_str: str, current_row: int,
                      data_context: List[Dict], columns_context: List[Dict]) -> Union[float, str]:
        """Calculate MAX for a range"""
        try:
            range_match = re.match(r'^([A-Z]+)(\d+):([A-Z]+)(\d+)$', range_str.strip())
            if not range_match:
                return '#ERROR!'
            
            start_col, start_row, end_col, end_row = range_match.groups()
            start_row_idx = int(start_row) - 1
            end_row_idx = int(end_row) - 1

            column = self._find_column_by_letter(start_col, columns_context)
            if not column:
                return '#ERROR!'
            
            values = []
            for i in range(start_row_idx, min(end_row_idx + 1, len(data_context))):
                if i >= 0:
                    value = self._get_numeric_value(data_context[i].get(column['key'], 0))
                    values.append(value)
            
            return max(values) if values else 0
            
        except Exception as e:
            logger.error(f"Error in _calculate_max: {str(e)}")
            return '#ERROR!'
    
    def _calculate_count(self, range_str: str, current_row: int,
                        data_context: List[Dict], columns_context: List[Dict]) -> Union[float, str]:
        """Calculate COUNT for a range"""
        try:
            range_match = re.match(r'^([A-Z]+)(\d+):([A-Z]+)(\d+)$', range_str.strip())
            if not range_match:
                return '#ERROR!'
            
            start_col, start_row, end_col, end_row = range_match.groups()
            start_row_idx = int(start_row) - 1
            end_row_idx = int(end_row) - 1

            column = self._find_column_by_letter(start_col, columns_context)
            if not column:
                return '#ERROR!'
            
            count = 0
            for i in range(start_row_idx, min(end_row_idx + 1, len(data_context))):
                if i >= 0:
                    value = data_context[i].get(column['key'], '')
                    if value and str(value).strip():  # Count non-empty cells
                        count += 1
            
            return count
            
        except Exception as e:
            logger.error(f"Error in _calculate_count: {str(e)}")
            return '#ERROR!'
    
    # Copy all helper methods from original engine
    def _get_cell_value(self, col_ref: str, row_index: int,
                       data_context: List[Dict], columns_context: List[Dict]) -> float:
        """Get value from a specific cell reference"""
        try:
            if row_index < 0 or row_index >= len(data_context):
                return 0

            column = self._find_column_by_letter(col_ref, columns_context)
            if not column:
                return 0
            
            value = data_context[row_index].get(column['key'], 0)
            return self._get_numeric_value(value)
            
        except Exception as e:
            logger.error(f"Error in _get_cell_value: {str(e)}")
            return 0
    
    def _parse_value(self, value: str, current_row: int,
                    data_context: List[Dict], columns_context: List[Dict]) -> float:
        """Parse a value that could be a cell reference or number"""
        try:
            # Check if it's a cell reference
            cell_ref_match = re.match(r'^([A-Z]+)(\d+)$', value)
            if cell_ref_match:
                col_ref, row_ref = cell_ref_match.groups()
                return self._get_cell_value(col_ref, int(row_ref) - 1, data_context, columns_context)
            
            # Try to parse as number
            return self._get_numeric_value(value)
            
        except Exception as e:
            logger.error(f"Error in _parse_value: {str(e)}")
            return 0
    
    def _perform_arithmetic(self, left: float, operator: str, right: float) -> Union[float, str]:
        """Perform arithmetic operation"""
        try:
            if operator == '+':
                return left + right
            elif operator == '-':
                return left - right
            elif operator == '*':
                return left * right
            elif operator == '/':
                return left / right if right != 0 else '#DIV/0!'
            else:
                return '#ERROR!'
        except Exception as e:
            logger.error(f"Error in arithmetic operation: {str(e)}")
            return '#ERROR!'
    
    def _find_column_by_title(self, title: str, columns_context: List[Dict]) -> Dict:
        """Find column definition by title"""
        for column in columns_context:
            if column.get('title') == title:
                return column
        return None
    
    def _get_column_key_by_title(self, title: str, columns_context: List[Dict]) -> str:
        """Get column key by title"""
        column = self._find_column_by_title(title, columns_context)
        return column['key'] if column else None
    
    def _get_numeric_value(self, value: Any) -> float:
        """Convert value to numeric, return 0 if not possible"""
        try:
            if isinstance(value, (int, float)):
                return float(value)
            elif isinstance(value, str):
                # Remove any non-numeric characters except decimal point and minus
                cleaned = re.sub(r'[^\d\.\-]', '', value)
                return float(cleaned) if cleaned else 0
            else:
                return 0
        except (ValueError, TypeError):
            return 0