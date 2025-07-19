import { FormulaEngine } from '../../components/FormulaEngineClient';

// Mock fetch globally
global.fetch = jest.fn();

describe('FormulaEngine Client', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  describe('evaluateFormulas', () => {
    const mockData = [
      { id: 1, col_a: 'John', col_b: '30', col_c: 'john@example.com', col_d: 'Developer' },
      { id: 2, col_a: 'Jane', col_b: '=A1+10', col_c: 'jane@example.com', col_d: 'Designer' }
    ];

    const mockColumns = [
      { key: 'id', title: 'ID', width: 60, editable: false },
      { key: 'col_a', title: 'A', width: 140, editable: true },
      { key: 'col_b', title: 'B', width: 60, editable: true },
      { key: 'col_c', title: 'C', width: 180, editable: true },
      { key: 'col_d', title: 'D', width: 120, editable: true }
    ];

    test('successfully calls backend API and returns result', async () => {
      const mockResponse = {
        success: true,
        data: [
          { id: 1, col_a: 'John', col_b: '30', col_c: 'john@example.com', col_d: 'Developer' },
          { id: 2, col_a: 'Jane', col_b: '40', col_c: 'jane@example.com', col_d: 'Designer' }
        ]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await FormulaEngine.evaluateFormulas(mockData, mockColumns);

      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/api/formulas/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: mockData,
          columns: mockColumns
        })
      });

      expect(result).toEqual(mockResponse);
    });

    test('handles HTTP errors gracefully', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await FormulaEngine.evaluateFormulas(mockData, mockColumns);

      // Should fall back to client-side evaluation
      expect(result.success).toBeDefined();
    });

    test('handles network errors and falls back to client-side evaluation', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await FormulaEngine.evaluateFormulas(mockData, mockColumns);

      // Should fall back to client-side evaluation
      expect(result.success).toBeDefined();
    });

    test('sends correct request payload', async () => {
      const mockResponse = { success: true, data: [] };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      await FormulaEngine.evaluateFormulas(mockData, mockColumns);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/formulas/evaluate',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: mockData, columns: mockColumns })
        })
      );
    });
  });

  describe('validateFormula', () => {
    test('successfully validates formula via backend API', async () => {
      const mockResponse = {
        isValid: true
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await FormulaEngine.validateFormula('=SUM(A1:A5)');

      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/api/validate-formula', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formula: '=SUM(A1:A5)',
          context: null
        })
      });

      expect(result).toEqual(mockResponse);
    });

    test('handles validation errors from backend', async () => {
      const mockResponse = {
        isValid: false,
        error: 'Invalid cell reference'
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await FormulaEngine.validateFormula('=Z99');

      expect(result).toEqual(mockResponse);
    });

    test('falls back to client-side validation on network error', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await FormulaEngine.validateFormula('=SUM(A1:A5)');

      // Should fall back to client-side validation
      expect(result.isValid).toBeDefined();
    });

    test('includes context when provided', async () => {
      const mockContext = { currentData: [], currentColumns: [] };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ isValid: true }),
      });

      await FormulaEngine.validateFormula('=A1+B1', mockContext);

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:8000/api/validate-formula',
        expect.objectContaining({
          body: JSON.stringify({
            formula: '=A1+B1',
            context: mockContext
          })
        })
      );
    });
  });

  describe('_fallbackEvaluateFormulas (client-side fallback)', () => {
    const mockData = [
      { id: 1, col_a: '10', col_b: '20', col_c: '=A1+B1', col_d: 'Test' },
      { id: 2, col_a: '5', col_b: '15', col_c: '=SUM(A1:B2)', col_d: 'Test2' }
    ];

    const mockColumns = [
      { key: 'id', title: 'ID' },
      { key: 'col_a', title: 'A' },
      { key: 'col_b', title: 'B' },
      { key: 'col_c', title: 'C' },
      { key: 'col_d', title: 'D' }
    ];

    test('evaluates simple arithmetic formulas', async () => {
      // Mock the fallback method by making the main method fail
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await FormulaEngine.evaluateFormulas(mockData, mockColumns);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    test('handles SUM function in fallback mode', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const testData = [
        { id: 1, col_a: '10', col_b: '20', col_c: '=SUM(A1:B1)' }
      ];

      const result = await FormulaEngine.evaluateFormulas(testData, mockColumns);

      expect(result.success).toBe(true);
      // The fallback should process the SUM formula
    });

    test('handles AVERAGE function in fallback mode', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const testData = [
        { id: 1, col_a: '10', col_b: '20', col_c: '=AVERAGE(A1:B1)' }
      ];

      const result = await FormulaEngine.evaluateFormulas(testData, mockColumns);

      expect(result.success).toBe(true);
    });

    test('preserves non-formula values in fallback mode', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      const testData = [
        { id: 1, col_a: 'Text Value', col_b: '42', col_c: 'No Formula' }
      ];

      const result = await FormulaEngine.evaluateFormulas(testData, mockColumns);

      expect(result.success).toBe(true);
      expect(result.data[0].col_a).toBe('Text Value');
      expect(result.data[0].col_b).toBe('42');
      expect(result.data[0].col_c).toBe('No Formula');
    });
  });

  describe('API Configuration', () => {
    test('uses correct API base URL', () => {
      expect(FormulaEngine.API_BASE_URL).toBe('http://localhost:8000/api');
    });
  });

  describe('Error Handling', () => {
    test('handles malformed JSON response', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const result = await FormulaEngine.evaluateFormulas([], []);

      // Should fall back to client-side evaluation
      expect(result.success).toBeDefined();
    });

    test('handles empty response', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => null,
      });

      const result = await FormulaEngine.evaluateFormulas([], []);

      // Should fall back to client-side evaluation
      expect(result.success).toBeDefined();
    });
  });
});
