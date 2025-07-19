"""
Enhanced formula parser that extracts cell dependencies for the dependency graph.
"""

import re
import logging
from typing import Set, List, Optional
from dependency_graph import CellRef

logger = logging.getLogger(__name__)


class FormulaParser:
    """Parse formulas and extract cell dependencies for the dependency graph."""
    
    def __init__(self):
        # Regex patterns for different types of references
        self.cell_pattern = re.compile(r'\b([A-Z]+)(\d+)\b')
        self.range_pattern = re.compile(r'\b([A-Z]+)(\d+):([A-Z]+)(\d+)\b')
        self.function_pattern = re.compile(r'\b([A-Z]+)\s*\([^)]*\)')
    
    def extract_dependencies(self, formula: str) -> Set[CellRef]:
        """Extract all cell dependencies from a formula."""
        try:
            # Remove leading = if present
            if formula.startswith('='):
                formula = formula[1:]
            
            dependencies = set()
            
            # Extract range references (A1:A5)
            range_matches = self.range_pattern.findall(formula.upper())
            for start_col, start_row, end_col, end_row in range_matches:
                range_refs = self._expand_range(start_col, int(start_row), end_col, int(end_row))
                dependencies.update(range_refs)
            
            # Remove range references from formula to avoid double-counting
            formula_without_ranges = self.range_pattern.sub('', formula.upper())
            
            # Extract individual cell references (A1, B2, etc.)
            cell_matches = self.cell_pattern.findall(formula_without_ranges)
            for col, row in cell_matches:
                dependencies.add(CellRef(col, int(row)))
            
            logger.debug(f"Extracted {len(dependencies)} dependencies from formula: {formula}")
            return dependencies
            
        except Exception as e:
            logger.error(f"Error extracting dependencies from formula '{formula}': {str(e)}")
            return set()
    
    def _expand_range(self, start_col: str, start_row: int, end_col: str, end_row: int) -> Set[CellRef]:
        """Expand a range reference (like A1:C3) into individual cell references."""
        try:
            cells = set()
            
            # Convert column letters to numbers for iteration
            start_col_num = self._column_to_number(start_col)
            end_col_num = self._column_to_number(end_col)
            
            # Ensure proper order
            if start_col_num > end_col_num:
                start_col_num, end_col_num = end_col_num, start_col_num
            if start_row > end_row:
                start_row, end_row = end_row, start_row
            
            # Generate all cells in the range
            for col_num in range(start_col_num, end_col_num + 1):
                col = self._number_to_column(col_num)
                for row in range(start_row, end_row + 1):
                    cells.add(CellRef(col, row))
            
            return cells
            
        except Exception as e:
            logger.error(f"Error expanding range {start_col}{start_row}:{end_col}{end_row}: {str(e)}")
            return set()
    
    def _column_to_number(self, col: str) -> int:
        """Convert column letter(s) to number (A=1, B=2, ..., Z=26, AA=27, etc.)"""
        result = 0
        for char in col.upper():
            result = result * 26 + (ord(char) - ord('A') + 1)
        return result
    
    def _number_to_column(self, num: int) -> str:
        """Convert number to column letter(s) (1=A, 2=B, ..., 26=Z, 27=AA, etc.)"""
        result = ""
        while num > 0:
            num -= 1  # Adjust for 0-based indexing
            result = chr(ord('A') + (num % 26)) + result
            num //= 26
        return result
    
    def validate_formula_syntax(self, formula: str) -> tuple[bool, Optional[str]]:
        """Validate basic formula syntax."""
        try:
            # Remove leading = if present
            if formula.startswith('='):
                formula = formula[1:]
            
            if not formula.strip():
                return False, "Empty formula"
            
            # Check for balanced parentheses
            paren_count = 0
            for char in formula:
                if char == '(':
                    paren_count += 1
                elif char == ')':
                    paren_count -= 1
                    if paren_count < 0:
                        return False, "Unmatched closing parenthesis"
            
            if paren_count > 0:
                return False, "Unmatched opening parenthesis"
            
            return True, None
            
        except Exception as e:
            logger.error(f"Error validating formula syntax '{formula}': {str(e)}")
            return False, f"Validation error: {str(e)}"