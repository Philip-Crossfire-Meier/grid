"""
Formula evaluation engine for spreadsheet-like calculations.
Supports Excel-style formulas including SUM, AVERAGE, cell references, and arithmetic operations.
"""

import re
import logging
from typing import Dict, List, Any, Union, Tuple

logger = logging.getLogger(__name__)


class FormulaEngine:
    """
    A formula evaluation engine that processes Excel-style formulas.
    """
    
    def __init__(self):
        self.functions = {
            'SUM': self._calculate_sum,
            'AVERAGE': self._calculate_average,
        }
    
    def evaluate_formulas(self, data: List[Dict], columns: List[Dict]) -> Dict[str, Any]:
        """
        Evaluate all formulas in the dataset.
        
        Args:
            data: List of row dictionaries containing cell values
            columns: List of column definitions with keys and titles
            
        Returns:
            Dictionary with success status and processed data
        """
        try:
            new_data = []
            
            for row_index, row in enumerate(data):
                new_row = row.copy()
                
                for column in columns:
                    cell_value = row.get(column['key'], '')
                    
                    if isinstance(cell_value, str) and cell_value.startswith('='):
                        try:
                            result = self._evaluate_formula(
                                cell_value, row_index, column['key'], data, columns
                            )
                            new_row[column['key']] = str(result) if result is not None else '#ERROR!'
                            logger.info(f"Formula '{cell_value}' evaluated to: {result}")
                        except Exception as e:
                            logger.error(f"Error evaluating formula '{cell_value}': {str(e)}")
                            new_row[column['key']] = '#ERROR!'
                
                new_data.append(new_row)
            
            return {
                'success': True,
                'data': new_data,
                'message': 'Formulas evaluated successfully'
            }
            
        except Exception as e:
            logger.error(f"Error in evaluate_formulas: {str(e)}")
            return {
                'success': False,
                'error': str(e),
                'message': 'Failed to evaluate formulas'
            }
    
    def _evaluate_formula(self, formula: str, current_row: int, current_col: str, 
                         data_context: List[Dict], columns_context: List[Dict]) -> Union[float, str]:
        """
        Parse and evaluate a single formula.
        
        Args:
            formula: The formula string (starting with =)
            current_row: Current row index
            current_col: Current column key
            data_context: Full dataset for context
            columns_context: Column definitions
            
        Returns:
            Evaluated result or error string
        """
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
    
    def _calculate_sum(self, range_str: str, current_row: int, 
                      data_context: List[Dict], columns_context: List[Dict]) -> Union[float, str]:
        """Calculate SUM for a range like A1:A5"""
        try:
            range_match = re.match(r'^([A-Z]+)(\d+):([A-Z]+)(\d+)$', range_str.strip())
            if not range_match:
                return '#ERROR!'
            
            start_col, start_row, end_col, end_row = range_match.groups()
            start_row_idx = int(start_row) - 1
            end_row_idx = int(end_row) - 1
            
            # Find the column
            column = self._find_column_by_title(start_col, columns_context)
            if not column:
                return '#ERROR!'
            
            total = 0
            for i in range(start_row_idx, min(end_row_idx + 1, len(data_context))):
                value = self._get_numeric_value(data_context[i].get(column['key'], 0))
                total += value
            
            return total
            
        except Exception as e:
            logger.error(f"Error in _calculate_sum: {str(e)}")
            return '#ERROR!'
    
    def _calculate_average(self, range_str: str, current_row: int,
                          data_context: List[Dict], columns_context: List[Dict]) -> Union[float, str]:
        """Calculate AVERAGE for a range like A1:A5"""
        try:
            sum_result = self._calculate_sum(range_str, current_row, data_context, columns_context)
            if isinstance(sum_result, str):  # Error occurred
                return sum_result
            
            range_match = re.match(r'^([A-Z]+)(\d+):([A-Z]+)(\d+)$', range_str.strip())
            if not range_match:
                return '#ERROR!'
            
            start_col, start_row, end_col, end_row = range_match.groups()
            count = int(end_row) - int(start_row) + 1
            
            return sum_result / count if count > 0 else '#DIV/0!'
            
        except Exception as e:
            logger.error(f"Error in _calculate_average: {str(e)}")
            return '#ERROR!'
    
    def _get_cell_value(self, col_ref: str, row_index: int,
                       data_context: List[Dict], columns_context: List[Dict]) -> float:
        """Get value from a specific cell reference"""
        try:
            if row_index < 0 or row_index >= len(data_context):
                return 0
            
            column = self._find_column_by_title(col_ref, columns_context)
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
