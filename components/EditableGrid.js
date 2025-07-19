import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native';
import { styles } from './EditableGridStyles';
import { FormulaEngine } from './FormulaEngineClient';

const EditableGrid = () => {
  // Sample data with editable cells
  const [data, setData] = useState([
    { id: 1, A: '', B: '', C: '', D: '' },
    { id: 2, A: '', B: '', C: '', D: '' },
    { id: 3, A: '', B: '', C: '', D: '' },
    { id: 4, A: '', B: '', C: '', D: '' },
    { id: 5, A: '', B: '', C: '', D: '' },
  ]);

  const [columns, setColumns] = useState([
    { key: 'id', title: 'ID', width: 60, editable: false },
    { key: 'A', title: 'Session Hours', width: 180, editable: true },
    { key: 'B', title: 'Rate per Hour', width: 180, editable: true },
    { key: 'C', title: 'Margin', width: 180, editable: true },
    { key: 'D', title: 'Total Cost', width: 180, editable: true },
  ]);

  const [editingCell, setEditingCell] = useState(null);
  const [tempValue, setTempValue] = useState('');
  const [formulaMode, setFormulaMode] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [editingHeader, setEditingHeader] = useState(null);
  const [tempHeaderValue, setTempHeaderValue] = useState('');
  const [showFormulas, setShowFormulas] = useState(false);
  const [originalFormulas, setOriginalFormulas] = useState({});
  const [cellErrors, setCellErrors] = useState({});

  const handleCellPress = (rowIndex, field, currentValue) => {
    setEditingCell({ rowIndex, field });
    setTempValue(currentValue);
    // Enable formula mode if the value starts with =
    setFormulaMode(currentValue.startsWith('='));
    
    // Only clear non-circular dependency errors when starting to edit
    // Keep circular dependency errors visible so user sees the warning
    const cellKey = `${rowIndex}-${field}`;
    const currentError = cellErrors[cellKey];
    if (currentError && currentError !== "Circular dependency detected") {
      setCellErrors(prev => {
        const updated = { ...prev };
        delete updated[cellKey];
        return updated;
      });
    }
  };

  // Validate formula against current data structure
  const validateFormula = (formula, excludeCell = null) => {
    if (!formula.startsWith('=')) {
      return { isValid: true };
    }

    try {
      // Extract cell references from the formula
      const cellRefs = formula.match(/[A-Z]+\d+/g) || [];
      const rangeRefs = formula.match(/[A-Z]+\d+:[A-Z]+\d+/g) || [];
      
      // Convert column letters to indices for validation
      const getColumnIndex = (letter) => {
        let result = 0;
        for (let i = 0; i < letter.length; i++) {
          result = result * 26 + (letter.charCodeAt(i) - 64);
        }
        return result - 1;
      };

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

  const handleCellSave = () => {
    if (editingCell) {
      const { rowIndex, field } = editingCell;
      const cellKey = `${rowIndex}-${field}`;
      
      // Validate formula if it starts with =
      if (tempValue.startsWith('=')) {
        const validation = validateFormula(tempValue, cellKey);
        
        if (!validation.isValid) {
          // Set error state and keep cell in editing mode
          setCellErrors(prev => ({
            ...prev,
            [cellKey]: validation.error
          }));
          return; // Don't save, keep in editing mode
        }
      }
      
      // Clear any existing error for this cell
      setCellErrors(prev => {
        const updated = { ...prev };
        delete updated[cellKey];
        return updated;
      });
      
      const newData = [...data];
      newData[rowIndex][field] = tempValue;
      
      // Store original formula if it starts with =
      if (tempValue.startsWith('=')) {
        setOriginalFormulas(prev => ({
          ...prev,
          [cellKey]: tempValue
        }));
      } else {
        // Remove from original formulas if it's no longer a formula
        setOriginalFormulas(prev => {
          const updated = { ...prev };
          delete updated[cellKey];
          return updated;
        });
      }
      
      setData(newData);
      setEditingCell(null);
      setTempValue('');
      setFormulaMode(false);
    }
  };

  const handleCellCancel = () => {
    // Clear any error state when canceling
    if (editingCell) {
      const { rowIndex, field } = editingCell;
      const cellKey = `${rowIndex}-${field}`;
      setCellErrors(prev => {
        const updated = { ...prev };
        delete updated[cellKey];
        return updated;
      });
    }
    
    setEditingCell(null);
    setTempValue('');
    setFormulaMode(false);
  };

  const handleHeaderPress = (columnKey, currentTitle) => {
    // Don't allow editing of ID column header
    if (columnKey === 'id') return;
    
    setEditingHeader(columnKey);
    setTempHeaderValue(currentTitle);
  };

  const handleHeaderSave = () => {
    if (editingHeader && tempHeaderValue.trim()) {
      const newColumns = columns.map(col => 
        col.key === editingHeader 
          ? { ...col, title: tempHeaderValue.trim() }
          : col
      );
      setColumns(newColumns);
      setEditingHeader(null);
      setTempHeaderValue('');
    }
  };

  const handleHeaderCancel = () => {
    setEditingHeader(null);
    setTempHeaderValue('');
  };

  // Formula evaluation function (simulates backend processing)
  // Update the evaluateFormulas function to send original formulas
const evaluateFormulas = async () => {
  setIsEvaluating(true);
  
  try {
    // Prepare data with original formulas restored
    const dataWithFormulas = data.map((row, rowIndex) => {
      const updatedRow = { ...row };
      
      // Restore original formulas for cells that have them
      columns.forEach(column => {
        if (column.editable) {
          const cellKey = `${rowIndex}-${column.key}`;
          const originalFormula = originalFormulas[cellKey];
          
          // If there's an original formula, use it instead of the evaluated value
          if (originalFormula) {
            updatedRow[column.key] = originalFormula;
          }
        }
      });
      
      return updatedRow;
    });
    
    console.log('Sending data with formulas to backend:', dataWithFormulas);
    
    const result = await FormulaEngine.evaluateFormulas(dataWithFormulas, columns);
    
    if (result.success) {
      setData(result.data);
      
      // Handle cell-specific errors from backend
      if (result.cell_errors) {
        setCellErrors(result.cell_errors);
        
        // Count errors for user feedback
        const errorCount = Object.keys(result.cell_errors).length;
        if (errorCount > 0) {
          Alert.alert(
            'Evaluation Complete', 
            `Formulas evaluated with ${errorCount} error(s). Check highlighted cells for details.`
          );
        } else {
          Alert.alert('Success', 'Formulas evaluated successfully!');
        }
      } else {
        // Clear any existing errors if no errors returned
        setCellErrors({});
        Alert.alert('Success', 'Formulas evaluated successfully!');
      }
    } else {
      // Handle general errors (like circular dependencies)
      if (result.cell_errors) {
        setCellErrors(result.cell_errors);
      }
      
      Alert.alert(
        'Evaluation Error', 
        result.message || result.error || 'Failed to evaluate formulas'
      );
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to evaluate formulas: ' + error.message);
  } finally {
    setIsEvaluating(false);
  }
};

  const addNewRow = () => {
    const newId = Math.max(...data.map(item => item.id)) + 1;
    const newRow = { id: newId };
    
    // Initialize all columns with default values
    columns.forEach(col => {
      if (col.key !== 'id') {
        newRow[col.key] = '';
      }
    });
    
    setData([...data, newRow]);
  };

  const addNewColumn = () => {
    const nextColumnLetter = getNextColumnLetter();
    const columnKey = nextColumnLetter; // Use the letter directly as the key
    
    const newColumn = {
      key: columnKey,
      title: `Column ${nextColumnLetter}`, // Give it a descriptive default title
      width: 120,
      editable: true
    };

    // Add the new column to the columns array
    setColumns([...columns, newColumn]);

    // Add the new field to all existing data rows with default value
    const updatedData = data.map(row => ({
      ...row,
      [columnKey]: ''
    }));
    setData(updatedData);
  };

  // Helper function to generate Excel-style column letters based on position
  const getNextColumnLetter = () => {
    // Count non-ID columns to determine position
    const editableColumns = columns.filter(col => col.key !== 'id');
    const position = editableColumns.length;
    
    // Convert position to Excel-style letter (0=A, 1=B, 25=Z, 26=AA, etc.)
    return numberToExcelColumn(position);
  };

  // Helper function to convert number to Excel column letters
  const numberToExcelColumn = (num) => {
    let result = '';
    while (num >= 0) {
      result = String.fromCharCode(65 + (num % 26)) + result;
      num = Math.floor(num / 26) - 1;
    }
    return result;
  };

  const deleteRow = (rowIndex) => {
    Alert.alert(
      'Delete Row',
      'Are you sure you want to delete this row?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            const newData = data.filter((_, index) => index !== rowIndex);
            setData(newData);
          }
        }
      ]
    );
  };

  const renderCell = (value, rowIndex, field, width = 120) => {
    const isEditing = editingCell && editingCell.rowIndex === rowIndex && editingCell.field === field;
    const cellKey = `${rowIndex}-${field}`;
    const originalFormula = originalFormulas[cellKey];
    const isFormula = originalFormula || (typeof value === 'string' && value.startsWith('='));
    const hasError = cellErrors[cellKey];
    
    // Determine what to display based on showFormulas mode
    const displayValue = showFormulas && originalFormula ? originalFormula : value;

    if (isEditing) {
      return (
        <View style={[
          styles.editingCell, 
          { width }, 
          formulaMode && styles.formulaEditingCell,
          hasError && styles.errorEditingCell
        ]}>
          <TextInput
            style={[
              styles.textInput, 
              formulaMode && styles.formulaTextInput,
              hasError && styles.errorTextInput
            ]}
            value={tempValue}
            onChangeText={(text) => {
              setTempValue(text);
              setFormulaMode(text.startsWith('='));
              // Clear circular dependency error only when user changes the formula
              // This gives them a chance to see the error message before typing
              if (hasError && hasError === "Circular dependency detected" && text !== tempValue) {
                setCellErrors(prev => {
                  const updated = { ...prev };
                  delete updated[cellKey];
                  return updated;
                });
              } else if (hasError && hasError !== "Circular dependency detected") {
                // Clear other types of errors immediately when typing
                setCellErrors(prev => {
                  const updated = { ...prev };
                  delete updated[cellKey];
                  return updated;
                });
              }
            }}
            onSubmitEditing={handleCellSave}
            onBlur={() => {
              // Only cancel if there's no error, otherwise keep in edit mode
              if (!hasError) {
                handleCellCancel();
              }
            }}
            onKeyPress={(e) => {
              // Allow Escape key to force cancel even with errors
              if (e.nativeEvent.key === 'Escape') {
                handleCellCancel();
              }
            }}
            autoFocus
            selectTextOnFocus
            placeholder={formulaMode ? "Enter formula (e.g., =SUM(A1:A5))" : "Enter value"}
          />
          {formulaMode && !hasError && (
            <Text style={styles.formulaHint}>Formula mode - starts with =</Text>
          )}
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={[
          styles.cell, 
          { width }, 
          isFormula && styles.formulaCell,
          hasError && styles.errorCell
        ]}
        onPress={() => handleCellPress(rowIndex, field, originalFormula || value)}
      >
        <Text style={[
          styles.cellText, 
          isFormula && styles.formulaCellText,
          hasError && styles.errorCellText
        ]}>
          {displayValue}
        </Text>
        {isFormula && <Text style={styles.formulaIndicator}>fx</Text>}
        {hasError && (
          <View style={styles.errorIndicator}>
            <Text style={styles.errorIndicatorText}>!</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerRow}>
      {columns.map((column) => {
        const isEditingThisHeader = editingHeader === column.key;
        const isIdColumn = column.key === 'id';
        
        if (isEditingThisHeader) {
          return (
            <View key={column.key} style={[styles.headerCell, { width: column.width }, styles.editingHeaderCell]}>
              <TextInput
                style={styles.headerInput}
                value={tempHeaderValue}
                onChangeText={setTempHeaderValue}
                onSubmitEditing={handleHeaderSave}
                onBlur={handleHeaderCancel}
                autoFocus
                selectTextOnFocus
                placeholder="Column name"
              />
            </View>
          );
        }
        
        return (
          <TouchableOpacity
            key={column.key}
            style={[
              styles.headerCell, 
              { width: column.width },
              !isIdColumn && styles.editableHeaderCell
            ]}
            onPress={() => handleHeaderPress(column.key, column.title)}
            disabled={isIdColumn}
          >
            <Text style={[
              styles.headerCellText, 
              isIdColumn && styles.nonEditableHeaderText,
              isIdColumn && { color: 'transparent' }
            ]}>
              {column.title}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Medical Data Grid</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.addButton, showFormulas ? styles.evaluateButton : null]} 
            onPress={() => setShowFormulas(!showFormulas)}
          >
            <Text style={[styles.addButtonText, showFormulas ? styles.evaluateButtonText : null]}>
              {showFormulas ? '📊 Show Values' : '🔢 Show Formulas'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.addButton, styles.evaluateButton]} 
            onPress={evaluateFormulas}
            disabled={isEvaluating}
          >
            <Text style={[styles.addButtonText, styles.evaluateButtonText]}>
              {isEvaluating ? 'Evaluating...' : '⚡ Evaluate'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addButton} onPress={addNewColumn}>
            <Text style={styles.addButtonText}>+ Add Column</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.addButton, styles.addRowButton]} onPress={addNewRow}>
            <Text style={[styles.addButtonText, styles.addRowButtonText]}>+ Add Row</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        <View style={styles.gridContainer}>
          {renderHeader()}
          <ScrollView showsVerticalScrollIndicator={false}>
            {data.map((row, rowIndex) => (
              <View key={row.id} style={styles.dataRow}>
                {columns.map((column) => (
                  column.editable ? 
                    renderCell(row[column.key] || '', rowIndex, column.key, column.width) :
                    <View key={column.key} style={[styles.cell, { width: column.width }]}>
                      <Text style={styles.cellText}>{row[column.key]}</Text>
                    </View>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {editingCell && (
        <View style={styles.editingOverlay}>
          <Text style={styles.editingText}>
            {formulaMode ? 
              `Formula mode: Examples: =SUM(A1:A5), =AVERAGE(A1:A3), =A1+B1, =A1*2` :
              `Editing: ${editingCell.field}. Press Enter to save, or tap outside to cancel.`
            }
          </Text>
        </View>
      )}

      {/* Error Panel - Shows all current errors */}
      {Object.keys(cellErrors).length > 0 && (
        <View style={styles.errorPanel}>
          <Text style={styles.errorPanelTitle}>
            ⚠️ {Object.keys(cellErrors).length} Error{Object.keys(cellErrors).length > 1 ? 's' : ''} Found
          </Text>
          {Object.entries(cellErrors).map(([cellKey, error]) => (
            <TouchableOpacity
              key={cellKey}
              style={styles.errorItem}
              onPress={() => {
                const [rowIndex, field] = cellKey.split('-');
                const currentValue = data[parseInt(rowIndex)]?.[field] || '';
                handleCellPress(parseInt(rowIndex), field, currentValue);
              }}
            >
              <Text style={styles.errorItemCell}>Cell {cellKey.replace('-', ' ').toUpperCase()}:</Text>
              <Text style={styles.errorItemMessage}>
                {error === "Circular dependency detected" 
                  ? "🔄 Circular dependency - formula references itself"
                  : `❌ ${error}`
                }
              </Text>
              <Text style={styles.errorItemAction}>Tap to fix →</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

export default EditableGrid;
