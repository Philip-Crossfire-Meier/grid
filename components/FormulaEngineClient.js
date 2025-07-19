// Formula evaluation client that communicates with Python backend API
export class FormulaEngine {
  
  static API_BASE_URL = 'http://localhost:8000/api';
  
  // Main formula evaluation function (calls Python backend)
  static async evaluateFormulas(data, columns) {
    try {
      console.log('Sending formula evaluation request to backend...');

      const response = await fetch(`${FormulaEngine.API_BASE_URL}/formulas/evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: data,
          columns: columns
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Check if we got a valid result, if not fall back to client-side evaluation
      if (!result || typeof result.success === 'undefined') {
        console.log('Invalid response from backend, falling back to client-side evaluation...');
        return FormulaEngine._fallbackEvaluateFormulas(data, columns);
      }
      
      console.log('Backend formula evaluation completed:', result);
      
      return result;
      
    } catch (error) {
      console.error('Error calling formula evaluation API:', error);
      
      // Fallback to client-side evaluation if backend is unavailable
      console.log('Falling back to client-side formula evaluation...');
      return FormulaEngine._fallbackEvaluateFormulas(data, columns);
    }
  }
  
  // Validate a single formula without evaluating it
  static async validateFormula(formula, context = null) {
    try {
      const response = await fetch(`${FormulaEngine.API_BASE_URL}/validate-formula`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formula: formula,
          context: context
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
      
    } catch (error) {
      console.error('Error validating formula:', error);
      return {
        isValid: false,
        error: 'Unable to validate formula - backend unavailable'
      };
    }
  }
  
  // Get list of supported functions from backend
  static async getSupportedFunctions() {
    try {
      const response = await fetch(`${FormulaEngine.API_BASE_URL}/supported-functions`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
      
    } catch (error) {
      console.error('Error getting supported functions:', error);
      return {
        functions: [
          { name: 'SUM', description: 'Sum of range', syntax: 'SUM(A1:A5)' },
          { name: 'AVERAGE', description: 'Average of range', syntax: 'AVERAGE(A1:A5)' },
          { name: 'Cell References', description: 'Individual cells', syntax: 'A1, B2' },
          { name: 'Arithmetic', description: 'Basic math', syntax: '+, -, *, /' }
        ]
      };
    }
  }
  
  // Check if backend API is available
  static async checkBackendHealth() {
    try {
      const response = await fetch('http://localhost:8000/health', {
        method: 'GET',
        timeout: 5000
      });
      
      return response.ok;
    } catch (error) {
      console.log('Backend health check failed:', error.message);
      return false;
    }
  }
  
  // Fallback client-side evaluation when backend is unavailable
  static async _fallbackEvaluateFormulas(data, columns) {
    try {
      // Simulate backend delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newData = data.map((row, rowIndex) => {
        const newRow = { ...row };
        
        columns.forEach(column => {
          const cellValue = row[column.key];
          if (typeof cellValue === 'string' && cellValue.startsWith('=')) {
            // Parse and evaluate formula using client-side fallback
            const result = FormulaEngine._evaluateFormulaFallback(cellValue, rowIndex, column.key, data, columns);
            console.log('Fallback formula evaluation:', cellValue, '->', result);
            newRow[column.key] = result !== null && result !== undefined ? String(result) : '#ERROR!';
          }
        });
        
        return newRow;
      });
      
      return { 
        success: true, 
        data: newData,
        message: 'Formulas evaluated using client-side fallback',
        fallback: true
      };
      
    } catch (error) {
      return { 
        success: false, 
        error: error.message,
        message: 'Formula evaluation failed'
      };
    }
  }
  
  // Basic client-side formula parser (fallback only)
  static _evaluateFormulaFallback(formula, currentRow, currentCol, dataContext, columnsContext) {
    try {
      const expression = formula.substring(1).toUpperCase();
      
      // Handle SUM function
      if (expression.startsWith('SUM(')) {
        const range = expression.match(/SUM\(([^)]+)\)/)?.[1];
        if (range) {
          return FormulaEngine._calculateSumFallback(range, dataContext, columnsContext);
        }
      }
      
      // Handle AVERAGE function
      if (expression.startsWith('AVERAGE(')) {
        const range = expression.match(/AVERAGE\(([^)]+)\)/)?.[1];
        if (range) {
          return FormulaEngine._calculateAverageFallback(range, dataContext, columnsContext);
        }
      }
      
      // Handle cell references
      const cellRefMatch = expression.match(/^([A-Z]+)(\d+)$/);
      if (cellRefMatch) {
        const [, colRef, rowRef] = cellRefMatch;
        return FormulaEngine._getCellValueFallback(colRef, parseInt(rowRef) - 1, dataContext, columnsContext);
      }
      
      // Handle simple arithmetic
      const arithmeticMatch = expression.match(/^(.+?)([\+\-\*\/])(.+?)$/);
      if (arithmeticMatch) {
        const [, left, operator, right] = arithmeticMatch;
        const leftValue = FormulaEngine._parseValueFallback(left.trim(), dataContext, columnsContext);
        const rightValue = FormulaEngine._parseValueFallback(right.trim(), dataContext, columnsContext);
        
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
  
  // Fallback helper functions (simplified versions)
  static _getCellValueFallback(colRef, rowIndex, dataContext, columnsContext) {
    if (rowIndex < 0 || rowIndex >= dataContext.length) return 0;
    
    const column = columnsContext.find(col => col.title === colRef);
    if (!column) return 0;
    
    const value = dataContext[rowIndex][column.key];
    return parseFloat(value) || 0;
  }
  
  static _calculateSumFallback(range, dataContext, columnsContext) {
    const rangeMatch = range.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
    if (!rangeMatch) return '#ERROR!';
    
    const [, startCol, startRow, endCol, endRow] = rangeMatch;
    const startRowIndex = parseInt(startRow) - 1;
    const endRowIndex = parseInt(endRow) - 1;
    
    const column = columnsContext.find(col => col.title === startCol);
    if (!column) return '#ERROR!';
    
    let sum = 0;
    for (let i = startRowIndex; i <= endRowIndex && i < dataContext.length; i++) {
      const value = parseFloat(dataContext[i][column.key]) || 0;
      sum += value;
    }
    
    return sum;
  }
  
  static _calculateAverageFallback(range, dataContext, columnsContext) {
    const sum = FormulaEngine._calculateSumFallback(range, dataContext, columnsContext);
    if (typeof sum !== 'number') return sum;
    
    const rangeMatch = range.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
    if (!rangeMatch) return '#ERROR!';
    
    const [, startCol, startRow, endCol, endRow] = rangeMatch;
    const count = parseInt(endRow) - parseInt(startRow) + 1;
    
    return count > 0 ? sum / count : '#ERROR!';
  }
  
  static _parseValueFallback(value, dataContext, columnsContext) {
    const cellRefMatch = value.match(/^([A-Z]+)(\d+)$/);
    if (cellRefMatch) {
      const [, colRef, rowRef] = cellRefMatch;
      return FormulaEngine._getCellValueFallback(colRef, parseInt(rowRef) - 1, dataContext, columnsContext);
    }
    
    const numValue = parseFloat(value);
    return isNaN(numValue) ? 0 : numValue;
  }
}
