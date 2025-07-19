/**
 * Test utility functions for EditableGrid tests
 */

import { fireEvent, screen } from '@testing-library/react';

/**
 * Gets the first available editable data cell (not header)
 * @returns {HTMLElement} The first editable data cell element
 */
export const getFirstEditableCell = () => {
  const cells = screen.getAllByRole('button');
  
  // Find cells that are in data rows (not header row)
  return cells.find(cell => {
    const cellElement = cell;
    const parent = cellElement.parentElement;
    
    // Check if this is a data cell (not header) and not a control button
    return (
      cellElement.textContent === '' && // Empty data cell
      parent &&
      !cellElement.textContent.includes('ID') &&
      !cellElement.textContent.includes('Session Hours') &&
      !cellElement.textContent.includes('Rate per Hour') &&
      !cellElement.textContent.includes('Margin') &&
      !cellElement.textContent.includes('Total Cost') &&
      !cellElement.textContent.includes('🔢') &&
      !cellElement.textContent.includes('⚡') &&
      !cellElement.textContent.includes('+ Add') &&
      !cellElement.textContent.includes('Column') &&
      !cellElement.textContent.includes('Remove Row')
    );
  });
};

/**
 * Enters edit mode for a cell and returns the input element
 * @param {HTMLElement} cell - The cell to edit
 * @returns {HTMLElement} The input element for editing
 */
export const enterEditMode = (cell) => {
  fireEvent.click(cell);
  
  // Try to find the input field with either placeholder
  try {
    return screen.getByPlaceholderText('Enter value');
  } catch (error) {
    try {
      return screen.getByPlaceholderText(/Enter formula/);
    } catch (formulaError) {
      // If neither placeholder works, try to find any input element
      const inputs = screen.getAllByRole('textbox');
      if (inputs.length > 0) {
        return inputs[0];
      }
      throw new Error('Unable to find input element in edit mode');
    }
  }
};

/**
 * Adds test data to the first cell for testing purposes
 * @param {string} value - The value to add
 * @returns {Object} Object containing cell and input elements
 */
export const addTestDataToFirstCell = (value) => {
  const cell = getFirstEditableCell();
  const input = enterEditMode(cell);
  fireEvent.change(input, { target: { value } });
  fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
  return { cell, input };
};
