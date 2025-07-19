// Formula evaluation engine that simulates backend processing
export class FormulaEngine {
  
  // Main formula evaluation function (simulates backend processing)
  static async evaluateFormulas(data, columns) {
    try {
      // Simulate backend API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newData = data.map((row, rowIndex) => {
        const newRow = { ...row };
        
        columns.forEach(column => {
          const cellValue = row[column.key];
          if (typeof cellValue === 'string' && cellValue.startsWith('=')) {
            // Parse and evaluate formula
            const result = FormulaEngine.evaluateFormula(cellValue, rowIndex, column.key, data, columns);
            console.log('Formula evaluation complete:', cellValue, '->', result);
            // Convert result to string to ensure it displays properly
            newRow[column.key] = result !== null && result !== undefined ? String(result) : '#ERROR!';
          }
        });
        
        return newRow;
      });
      
      return { success: true, data: newData };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Basic formula parser (simulates backend formula engine)
  static evaluateFormula(formula, currentRow, currentCol, dataContext, columnsContext) {
    console.log(`Evaluating: ${formula}`);
    try {
      // Remove the = sign
      const expression = formula.substring(1).toUpperCase();
      
      // Handle SUM function: =SUM(A1:A5)
      if (expression.startsWith('SUM(')) {
        const range = expression.match(/SUM\(([^)]+)\)/)?.[1];
        if (range) {
          return FormulaEngine.calculateSum(range, currentRow, dataContext, columnsContext);
        }
      }
      
      // Handle AVERAGE function: =AVERAGE(A1:A5)
      if (expression.startsWith('AVERAGE(')) {
        const range = expression.match(/AVERAGE\(([^)]+)\)/)?.[1];
        if (range) {
          return FormulaEngine.calculateAverage(range, currentRow, dataContext, columnsContext);
        }
      }
      
      // Handle cell references: =A1, =B2, etc.
      const cellRefMatch = expression.match(/^([A-Z]+)(\d+)$/);
      if (cellRefMatch) {
        const [, colRef, rowRef] = cellRefMatch;
        return FormulaEngine.getCellValue(colRef, parseInt(rowRef) - 1, dataContext, columnsContext);
      }
      
      // Handle simple arithmetic: =A1+B1, =A1*2, etc.
      const arithmeticMatch = expression.match(/^(.+?)([\+\-\*\/])(.+?)$/);
      if (arithmeticMatch) {
        const [, left, operator, right] = arithmeticMatch;
        const leftValue = FormulaEngine.parseValue(left.trim(), currentRow, dataContext, columnsContext);
        const rightValue = FormulaEngine.parseValue(right.trim(), currentRow, dataContext, columnsContext);
        
        switch (operator) {
          case '+': return leftValue + rightValue;
          case '-': return leftValue - rightValue;
          case '*': return leftValue * rightValue;
          case '/': return rightValue !== 0 ? leftValue / rightValue : '#DIV/0!';
          default: return '#ERROR!';
        }
      }
      
      return '#ERROR!';
    } catch (error) {
      return '#ERROR!';
    }
  }

  // Helper function to get column index from letter (A=0, B=1, etc.)
  static getColumnIndex(colRef) {
    // Convert Excel column letter to index
    let result = 0;
    for (let i = 0; i < colRef.length; i++) {
      result = result * 26 + (colRef.charCodeAt(i) - 65 + 1);
    }
    return result - 1; // Convert to 0-based index
  }

  // Helper function to get cell value by reference
  static getCellValue(colRef, rowIndex, dataContext, columnsContext) {
    if (rowIndex < 0 || rowIndex >= dataContext.length) {
      console.log('getCellValue: Row index out of bounds:', rowIndex);
      return 0;
    }
    
    // Find the column that matches the letter
    const column = columnsContext.find(col => col.title === colRef);
    if (!column) {
      console.log('getCellValue: Column not found for reference:', colRef);
      return 0;
    }
    
    const value = dataContext[rowIndex][column.key];
    const parsedValue = parseFloat(value) || 0;
    console.log(`getCellValue(${colRef}${rowIndex + 1}): "${value}" -> ${parsedValue}`);
    return parsedValue;
  }

  // Helper function to calculate sum for a range
  static calculateSum(range, currentRow, dataContext, columnsContext) {
    const rangeMatch = range.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
    if (!rangeMatch) {
      console.log('calculateSum: Invalid range format:', range);
      return '#ERROR!';
    }
    
    const [, startCol, startRow, endCol, endRow] = rangeMatch;
    const startRowIndex = parseInt(startRow) - 1;
    const endRowIndex = parseInt(endRow) - 1;
    
    // Find the column that matches the letter
    const column = columnsContext.find(col => col.title === startCol);
    if (!column) {
      console.log('calculateSum: Column not found:', startCol);
      return '#ERROR!';
    }
    
    let sum = 0;
    for (let i = startRowIndex; i <= endRowIndex && i < dataContext.length; i++) {
      const value = parseFloat(dataContext[i][column.key]) || 0;
      sum += value;
    }
    
    console.log(`calculateSum(${range}): ${sum}`);
    return sum;
  }

  // Helper function to calculate average for a range
  static calculateAverage(range, currentRow, dataContext, columnsContext) {
    const sum = FormulaEngine.calculateSum(range, currentRow, dataContext, columnsContext);
    if (typeof sum !== 'number') return sum;
    
    const rangeMatch = range.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
    if (!rangeMatch) return '#ERROR!';
    
    const [, startCol, startRow, endCol, endRow] = rangeMatch;
    const count = parseInt(endRow) - parseInt(startRow) + 1;
    
    return count > 0 ? sum / count : '#ERROR!';
  }

  // Helper function to parse values (handles cell references and numbers)
  static parseValue(value, currentRow, dataContext, columnsContext) {
    // If it's a cell reference
    const cellRefMatch = value.match(/^([A-Z]+)(\d+)$/);
    if (cellRefMatch) {
      const [, colRef, rowRef] = cellRefMatch;
      return FormulaEngine.getCellValue(colRef, parseInt(rowRef) - 1, dataContext, columnsContext);
    }
    
    // If it's a number
    const numValue = parseFloat(value);
    return isNaN(numValue) ? 0 : numValue;
  }
}
