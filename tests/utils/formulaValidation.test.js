// Test utilities for formula validation
// These tests validate the formula validation logic extracted from EditableGrid

describe('Formula Validation Utilities', () => {
  // Mock data structure similar to what's used in EditableGrid
  const mockData = [
    { id: 1, col_a: 'John', col_b: '30', col_c: 'john@example.com', col_d: 'Developer' },
    { id: 2, col_a: 'Jane', col_b: '25', col_c: 'jane@example.com', col_d: 'Designer' },
    { id: 3, col_a: 'Bob', col_b: '35', col_c: 'bob@example.com', col_d: 'Manager' },
    { id: 4, col_a: 'Alice', col_b: '28', col_c: 'alice@example.com', col_d: 'Analyst' },
    { id: 5, col_a: 'Charlie', col_b: '32', col_c: 'charlie@example.com', col_d: 'Engineer' }
  ];

  const mockColumns = [
    { key: 'id', title: 'ID', width: 60, editable: false },
    { key: 'col_a', title: 'A', width: 140, editable: true },
    { key: 'col_b', title: 'B', width: 60, editable: true },
    { key: 'col_c', title: 'C', width: 180, editable: true },
    { key: 'col_d', title: 'D', width: 120, editable: true }
  ];

  // Helper function to convert column letters to indices (extracted from EditableGrid logic)
  const getColumnIndex = (letter) => {
    let result = 0;
    for (let i = 0; i < letter.length; i++) {
      result = result * 26 + (letter.charCodeAt(i) - 64);
    }
    return result - 1;
  };

  // Formula validation function (extracted from EditableGrid)
  const validateFormula = (formula, data, columns, excludeCell = null) => {
    if (!formula.startsWith('=')) {
      return { isValid: true };
    }

    try {
      // Extract cell references from the formula
      const cellRefs = formula.match(/[A-Z]+\d+/g) || [];
      const rangeRefs = formula.match(/[A-Z]+\d+:[A-Z]+\d+/g) || [];

      // Check individual cell references
      for (const cellRef of cellRefs) {
        const match = cellRef.match(/([A-Z]+)(\d+)/);
        if (match) {
          const colLetter = match[1];
          const rowNumber = parseInt(match[2]);
          
          // Check if row exists (1-based to 0-based conversion)
          if (rowNumber < 1 || rowNumber > data.length) {
            return { isValid: false, error: `Row ${rowNumber} does not exist. Valid rows are 1-${data.length}.` };
          }
          
          // Check if column exists
          const colIndex = getColumnIndex(colLetter);
          const availableColumns = columns.filter(col => col.key !== 'id');
          if (colIndex >= availableColumns.length) {
            const maxCol = availableColumns.length > 0 ? 
              String.fromCharCode(64 + availableColumns.length) : 'A';
            return { isValid: false, error: `Column ${colLetter} does not exist. Valid columns are A-${maxCol}.` };
          }
        }
      }

      // Check range references
      for (const rangeRef of rangeRefs) {
        const [startCell, endCell] = rangeRef.split(':');
        const startMatch = startCell.match(/([A-Z]+)(\d+)/);
        const endMatch = endCell.match(/([A-Z]+)(\d+)/);
        
        if (startMatch && endMatch) {
          const startRow = parseInt(startMatch[2]);
          const endRow = parseInt(endMatch[2]);
          const startCol = getColumnIndex(startMatch[1]);
          const endCol = getColumnIndex(endMatch[1]);
          
          // Validate range bounds
          if (startRow < 1 || endRow > data.length || startRow > endRow) {
            return { isValid: false, error: `Invalid row range ${startRow}:${endRow}. Valid rows are 1-${data.length}.` };
          }
          
          const availableColumns = columns.filter(col => col.key !== 'id');
          if (startCol < 0 || endCol >= availableColumns.length || startCol > endCol) {
            const maxCol = availableColumns.length > 0 ? 
              String.fromCharCode(64 + availableColumns.length) : 'A';
            return { isValid: false, error: `Invalid column range. Valid columns are A-${maxCol}.` };
          }
        }
      }

      // Check for basic syntax errors
      if (formula.includes('SUM(') && !formula.includes(')')) {
        return { isValid: false, error: 'Missing closing parenthesis in SUM function.' };
      }
      if (formula.includes('AVERAGE(') && !formula.includes(')')) {
        return { isValid: false, error: 'Missing closing parenthesis in AVERAGE function.' };
      }

      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: 'Invalid formula syntax.' };
    }
  };

  describe('Column Index Conversion', () => {
    test('converts single letter columns correctly', () => {
      expect(getColumnIndex('A')).toBe(0);
      expect(getColumnIndex('B')).toBe(1);
      expect(getColumnIndex('C')).toBe(2);
      expect(getColumnIndex('Z')).toBe(25);
    });

    test('converts double letter columns correctly', () => {
      expect(getColumnIndex('AA')).toBe(26);
      expect(getColumnIndex('AB')).toBe(27);
      expect(getColumnIndex('AZ')).toBe(51);
    });
  });

  describe('Cell Reference Validation', () => {
    test('validates correct cell references', () => {
      expect(validateFormula('=A1', mockData, mockColumns)).toEqual({ isValid: true });
      expect(validateFormula('=B2', mockData, mockColumns)).toEqual({ isValid: true });
      expect(validateFormula('=D5', mockData, mockColumns)).toEqual({ isValid: true });
    });

    test('rejects invalid row references', () => {
      const result = validateFormula('=A6', mockData, mockColumns);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Row 6 does not exist');
    });

    test('rejects row numbers that are too low', () => {
      const result = validateFormula('=A0', mockData, mockColumns);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Row 0 does not exist');
    });

    test('rejects invalid column references', () => {
      const result = validateFormula('=E1', mockData, mockColumns);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Column E does not exist');
    });

    test('rejects far out-of-range column references', () => {
      const result = validateFormula('=Z1', mockData, mockColumns);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Column Z does not exist');
    });
  });

  describe('Range Reference Validation', () => {
    test('validates correct range references', () => {
      expect(validateFormula('=SUM(A1:A5)', mockData, mockColumns)).toEqual({ isValid: true });
      expect(validateFormula('=AVERAGE(B1:B3)', mockData, mockColumns)).toEqual({ isValid: true });
      expect(validateFormula('=SUM(A1:D1)', mockData, mockColumns)).toEqual({ isValid: true });
    });

    test('rejects ranges with invalid start row', () => {
      const result = validateFormula('=SUM(A0:A5)', mockData, mockColumns);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Row 0 does not exist');
    });

    test('rejects ranges with invalid end row', () => {
      const result = validateFormula('=SUM(A1:A6)', mockData, mockColumns);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Row 6 does not exist');
    });

    test('rejects ranges where start > end row', () => {
      const result = validateFormula('=SUM(A5:A1)', mockData, mockColumns);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid row range');
    });

    test('rejects ranges with invalid start column', () => {
      const result = validateFormula('=SUM(E1:E5)', mockData, mockColumns);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Column E does not exist');
    });

    test('rejects ranges with invalid end column', () => {
      const result = validateFormula('=SUM(A1:E5)', mockData, mockColumns);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Column E does not exist');
    });
  });

  describe('Function Syntax Validation', () => {
    test('rejects SUM function with missing closing parenthesis', () => {
      const result = validateFormula('=SUM(A1:A5', mockData, mockColumns);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Missing closing parenthesis in SUM function');
    });

    test('rejects AVERAGE function with missing closing parenthesis', () => {
      const result = validateFormula('=AVERAGE(A1:A5', mockData, mockColumns);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Missing closing parenthesis in AVERAGE function');
    });

    test('accepts properly formatted function calls', () => {
      expect(validateFormula('=SUM(A1:A5)', mockData, mockColumns)).toEqual({ isValid: true });
      expect(validateFormula('=AVERAGE(B1:B3)', mockData, mockColumns)).toEqual({ isValid: true });
    });
  });

  describe('Complex Formula Validation', () => {
    test('validates formulas with multiple cell references', () => {
      expect(validateFormula('=A1+B1+C1', mockData, mockColumns)).toEqual({ isValid: true });
      expect(validateFormula('=A1*B2-C3', mockData, mockColumns)).toEqual({ isValid: true });
    });

    test('validates mixed function and arithmetic formulas', () => {
      expect(validateFormula('=SUM(A1:A3)+B4', mockData, mockColumns)).toEqual({ isValid: true });
      expect(validateFormula('=AVERAGE(A1:A5)*2', mockData, mockColumns)).toEqual({ isValid: true });
    });

    test('rejects formulas with any invalid reference', () => {
      const result = validateFormula('=A1+B1+E1', mockData, mockColumns);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Column E does not exist');
    });
  });

  describe('Non-Formula Values', () => {
    test('accepts non-formula values', () => {
      expect(validateFormula('42', mockData, mockColumns)).toEqual({ isValid: true });
      expect(validateFormula('Hello World', mockData, mockColumns)).toEqual({ isValid: true });
      expect(validateFormula('test@example.com', mockData, mockColumns)).toEqual({ isValid: true });
    });

    test('accepts empty values', () => {
      expect(validateFormula('', mockData, mockColumns)).toEqual({ isValid: true });
    });
  });

  describe('Edge Cases', () => {
    test('handles formulas with whitespace', () => {
      expect(validateFormula('= A1 + B1 ', mockData, mockColumns)).toEqual({ isValid: true });
    });

    test('handles case sensitivity in cell references', () => {
      expect(validateFormula('=a1+b1', mockData, mockColumns)).toEqual({ isValid: true });
    });
  });

  describe('Dynamic Data Validation', () => {
    test('adapts to different data sizes', () => {
      const smallData = [
        { id: 1, col_a: 'Test', col_b: '10' }
      ];
      
      expect(validateFormula('=A1', smallData, mockColumns)).toEqual({ isValid: true });
      
      const result = validateFormula('=A2', smallData, mockColumns);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Row 2 does not exist. Valid rows are 1-1.');
    });

    test('adapts to different column configurations', () => {
      const limitedColumns = [
        { key: 'id', title: 'ID', editable: false },
        { key: 'col_a', title: 'A', editable: true }
      ];
      
      expect(validateFormula('=A1', mockData, limitedColumns)).toEqual({ isValid: true });
      
      const result = validateFormula('=B1', mockData, limitedColumns);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Column B does not exist. Valid columns are A-A.');
    });
  });
});
