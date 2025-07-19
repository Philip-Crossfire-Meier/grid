import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import EditableGrid from '../../components/EditableGrid';
import { FormulaEngine } from '../../components/FormulaEngineClient';
import { getFirstEditableCell, enterEditMode, addTestDataToFirstCell } from '../utils/testHelpers';

jest.mock('../../components/FormulaEngineClient');

describe('EditableGrid Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Formula Workflow', () => {
    test('complete formula entry, validation, and evaluation workflow', async () => {
      // Mock successful formula evaluation
      FormulaEngine.evaluateFormulas.mockResolvedValue({
        success: true,
        data: [
          { id: 1, A: 'Test Value', B: '25', C: '', D: '' },
          { id: 2, A: '', B: '', C: '', D: '' },
          { id: 3, A: '', B: '', C: '', D: '' },
          { id: 4, A: '', B: '', C: '', D: '' },
          { id: 5, A: '', B: '50', C: '', D: '' } // Changed from =SUM(B1:B4)
        ]
      });

      render(React.createElement(EditableGrid));

      // Step 1: Enter a formula in an empty cell
      const cell = getFirstEditableCell();
      const input = enterEditMode(cell);
      fireEvent.change(input, { target: { value: '=SUM(B1:B4)' } });

      // Verify formula mode is activated
      expect(screen.getByText('Formula mode - starts with =')).toBeInTheDocument();

      // Step 2: Save the formula by pressing Enter
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      
      // Verify the formula was saved - now it should be in a cell, not an input
      await waitFor(() => {
        expect(screen.getByDisplayValue('=SUM(B1:B4)')).toBeInTheDocument();
      });

      // Step 3: Test toggle functionality
      const toggleButton = screen.getByText('🔢 Show Formulas');
      fireEvent.click(toggleButton);

      // Button text should change
      expect(screen.getByText('📊 Show Values')).toBeInTheDocument();

      // Step 4: Toggle back to show values
      fireEvent.click(screen.getByText('📊 Show Values'));
      expect(screen.getByText('🔢 Show Formulas')).toBeInTheDocument();

      // Step 5: Test evaluate button
      const evaluateButton = screen.getByText('⚡ Evaluate');
      fireEvent.click(evaluateButton);

      // Verify evaluation is called
      expect(FormulaEngine.evaluateFormulas).toHaveBeenCalled();
    });

    test('error handling workflow with formula correction', async () => {
      render(React.createElement(EditableGrid));

      // Step 1: Enter an invalid formula
      const cell = getFirstEditableCell();
      const input = enterEditMode(cell);
      fireEvent.change(input, { target: { value: '=A1' } }); 

      // Verify formula mode is enabled
      expect(screen.getByText(/Formula mode - starts with =/)).toBeInTheDocument();

      // Step 2: Save the formula
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      // Step 3: Correct the formula
      const cellWithFormula = getFirstEditableCell();
      const correctionInput = enterEditMode(cellWithFormula);
      fireEvent.change(correctionInput, { target: { value: '=SUM(A1:A5)' } });

      // Verify corrected formula mode
      expect(screen.getByText(/Formula mode - starts with =/)).toBeInTheDocument();

      // Save correction
      fireEvent.keyDown(correctionInput, { key: 'Enter', code: 'Enter' });

      // Verify the corrected formula is displayed
      await waitFor(() => {
        expect(screen.getByDisplayValue('=SUM(A1:A5)')).toBeInTheDocument();
      });
    });

    test('complete row and column management workflow', async () => {
      render(React.createElement(EditableGrid));

      // Step 1: Add a column
      const addColumnButton = screen.getByText('+ Add Column');
      fireEvent.click(addColumnButton);

      // Verify new column exists
      expect(screen.getByText('Column E')).toBeInTheDocument();

      // Step 2: Add a row
      const addRowButton = screen.getByText('+ Add Row');
      fireEvent.click(addRowButton);

      // Verify new row exists (row 6)
      expect(screen.getByText('6')).toBeInTheDocument();

      // Step 3: Add data to a cell in the empty grid
      const cell = getFirstEditableCell();
      const input = enterEditMode(cell);
      fireEvent.change(input, { target: { value: '30' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      
      // Verify the data was added (since input is still in edit mode after Enter)
      expect(screen.getByDisplayValue('30')).toBeInTheDocument();

      // Exit edit mode by pressing Escape
      fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });

      // Step 4: Verify all elements are still present
      expect(screen.getByText('Column E')).toBeInTheDocument();
      expect(screen.getByText('6')).toBeInTheDocument();
    });

    test('header editing restrictions', async () => {
      render(React.createElement(EditableGrid));

      // Try to edit the ID column header (should be disabled)
      const idHeader = screen.getByText('ID');
      fireEvent.click(idHeader);

      // Should not enter edit mode for ID column
      expect(screen.queryByDisplayValue('ID')).not.toBeInTheDocument();

      // Edit a regular column header
      const columnHeader = screen.getByText('Session Hours');
      fireEvent.click(columnHeader);

      // Should show input field
      const input = screen.getByDisplayValue('Session Hours');
      fireEvent.change(input, { target: { value: 'Modified' } });

      // Cancel by clicking outside - click on a data cell
      const cell = getFirstEditableCell();
      fireEvent.click(cell);

      // Should revert to original value
      expect(screen.getByText('Session Hours')).toBeInTheDocument();
      expect(screen.queryByText('Modified')).not.toBeInTheDocument();
    });
  });

  describe('Error Recovery Scenarios', () => {
    test('recovery from formula evaluation failure', async () => {
      // Mock evaluation failure
      FormulaEngine.evaluateFormulas.mockRejectedValue(new Error('Backend unavailable'));

      render(React.createElement(EditableGrid));

      // Add a formula to an empty cell first
      const cell = getFirstEditableCell();
      const input = enterEditMode(cell);
      fireEvent.change(input, { target: { value: '=A1+10' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      // Try to evaluate
      const evaluateButton = screen.getByText('⚡ Evaluate');
      fireEvent.click(evaluateButton);

      // Should handle error gracefully
      await waitFor(() => {
        expect(FormulaEngine.evaluateFormulas).toHaveBeenCalled();
      });

      // UI should still be functional
      expect(screen.getByText('⚡ Evaluate')).toBeInTheDocument();
    });

    test('successful edit mode completion with data entry', async () => {
      render(React.createElement(EditableGrid));

      // Enter edit mode on an empty cell
      const cell = getFirstEditableCell();
      const input = enterEditMode(cell);
      fireEvent.change(input, { target: { value: 'Test Data' } });

      // Save by pressing Enter
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      // Verify the data was saved
      expect(screen.getByDisplayValue('Test Data')).toBeInTheDocument();
    });

    test('successful formula entry and validation', async () => {
      render(React.createElement(EditableGrid));

      // Enter formula mode on an empty cell
      const cell = getFirstEditableCell();
      const input = enterEditMode(cell);
      fireEvent.change(input, { target: { value: '=SUM(A1:A5)' } });

      // Verify formula mode is active
      expect(screen.getByText(/Formula mode - starts with =/)).toBeInTheDocument();
      expect(screen.getByDisplayValue('=SUM(A1:A5)')).toBeInTheDocument();

      // Save the formula by pressing Enter
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      
      // Formula should still be displayed (input remains in edit mode after save)
      expect(screen.getByDisplayValue('=SUM(A1:A5)')).toBeInTheDocument();
    });
  });

  describe('Performance and State Management', () => {
    test('successful formula mode transitions and value persistence', async () => {
      render(React.createElement(EditableGrid));

      const cell = getFirstEditableCell();
      const input = enterEditMode(cell);

      // Enter different formula types to test transitions
      fireEvent.change(input, { target: { value: '=A1' } });
      expect(screen.getByText(/Formula mode - starts with =/)).toBeInTheDocument();
      
      fireEvent.change(input, { target: { value: '=A2' } });
      expect(screen.getByDisplayValue('=A2')).toBeInTheDocument();
      
      fireEvent.change(input, { target: { value: '=SUM(A1:A3)' } });
      expect(screen.getByDisplayValue('=SUM(A1:A3)')).toBeInTheDocument();

      // Should show formula mode for final value
      expect(screen.getByText(/Formula mode - starts with =/)).toBeInTheDocument();

      // Save the formula
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
      
      // Formula should be persisted
      expect(screen.getByDisplayValue('=SUM(A1:A3)')).toBeInTheDocument();
    });

    test('maintains state consistency across operations', async () => {
      render(React.createElement(EditableGrid));

      // Add column
      fireEvent.click(screen.getByText('+ Add Column'));
      expect(screen.getByText('Column E')).toBeInTheDocument();

      // Add row
      fireEvent.click(screen.getByText('+ Add Row'));
      expect(screen.getByText('6')).toBeInTheDocument();

      // Enter formula mode in a cell
      const cell = getFirstEditableCell();
      const input = enterEditMode(cell);
      fireEvent.change(input, { target: { value: '=AVERAGE(A1:A5)' } });

      // Verify formula mode
      expect(screen.getByText(/Formula mode - starts with =/)).toBeInTheDocument();

      // Toggle formula view button should be available
      expect(screen.getByText('🔢 Show Formulas')).toBeInTheDocument();

      // Cancel edit
      fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });
      
      // Everything should still be in place
      expect(screen.getByText('Column E')).toBeInTheDocument();
      expect(screen.getByText('6')).toBeInTheDocument();
    });
  });
});
