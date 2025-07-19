# Testing Setup for React Grid

This directory contains unit tests for the React Grid application.

## Setup

To install testing dependencies, run:

```bash
npm install --save-dev @testing-library/react-native @testing-library/jest-native jest-expo jest react-test-renderer
```

## Test Structure

- `components/` - Tests for React components
- `utils/` - Tests for utility functions and services
- `setup/` - Test configuration and mocks

## Running Tests

```bash
npm test
```

## Test Files

- `EditableGrid.test.js` - Tests for the main grid component
- `FormulaEngineClient.test.js` - Tests for formula engine client
- `formulaValidation.test.js` - Tests for formula validation logic
