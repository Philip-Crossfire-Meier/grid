# Testing Documentation for React Grid

This document provides comprehensive information about the testing setup and strategy for the React Grid application.

## 🏗️ Test Architecture

### Test Structure
```
tests/
├── components/           # Component-specific tests
│   ├── App.test.js
│   ├── EditableGrid.test.js
│   ├── EditableGrid.integration.test.js
│   └── FormulaEngineClient.test.js
├── utils/               # Utility function tests
│   └── formulaValidation.test.js
├── setup/               # Test configuration
│   └── testSetup.js
├── run-tests.sh         # Test runner script
└── README.md           # This file
```

## 🧪 Test Categories

### 1. Unit Tests
- **Component Tests**: Test individual React components in isolation
- **Utility Tests**: Test helper functions and validation logic
- **API Client Tests**: Test FormulaEngine client functionality

### 2. Integration Tests
- **Workflow Tests**: Test complete user workflows
- **State Management**: Test complex state interactions
- **Error Handling**: Test error scenarios and recovery

### 3. Coverage Targets
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

## 🚀 Getting Started

### Installation
```bash
# Install testing dependencies
npm install --save-dev @testing-library/react-native @testing-library/jest-native jest jest-expo react-test-renderer

# Or use the automated script
./tests/run-tests.sh
```

### Running Tests

#### Quick Commands
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch

# CI mode (for automated testing)
npm run test:ci
```

#### Using Test Runner Script
```bash
# Interactive mode
./tests/run-tests.sh

# Command line options
./tests/run-tests.sh --all          # All tests
./tests/run-tests.sh --components   # Component tests only
./tests/run-tests.sh --utils        # Utility tests only
./tests/run-tests.sh --integration  # Integration tests only
./tests/run-tests.sh --coverage     # With coverage report
./tests/run-tests.sh --watch        # Watch mode
```

## 📋 Test Coverage

### EditableGrid Component
- ✅ Rendering and initial state
- ✅ Cell editing functionality
- ✅ Formula entry and validation
- ✅ Error handling and recovery
- ✅ Formula/value toggle feature
- ✅ Row and column management
- ✅ Header editing
- ✅ Keyboard interactions
- ✅ State persistence

### FormulaEngineClient
- ✅ Backend API communication
- ✅ Error handling and fallbacks
- ✅ Request/response validation
- ✅ Network error recovery
- ✅ Client-side formula evaluation

### Formula Validation
- ✅ Cell reference validation
- ✅ Range reference validation
- ✅ Function syntax checking
- ✅ Error message generation
- ✅ Edge case handling

### Integration Workflows
- ✅ Complete formula workflow
- ✅ Error correction workflow
- ✅ Row/column management
- ✅ Multi-operation consistency

## 🎯 Testing Strategies

### 1. Component Testing
```javascript
// Example: Testing cell editing
test('enters edit mode when cell is pressed', () => {
  render(<EditableGrid />);
  const cell = screen.getByText('John Doe');
  fireEvent.press(cell);
  
  expect(screen.getByDisplayValue('John Doe')).toBeTruthy();
});
```

### 2. Mock Strategy
```javascript
// Mock external dependencies
jest.mock('../../components/FormulaEngineClient', () => ({
  FormulaEngine: {
    evaluateFormulas: jest.fn(),
    validateFormula: jest.fn(),
  },
}));
```

### 3. Error Testing
```javascript
// Test error scenarios
test('shows error for invalid formula', () => {
  render(<EditableGrid />);
  // ... simulate invalid formula entry
  expect(screen.getByText(/Row 10 does not exist/)).toBeTruthy();
});
```

### 4. Integration Testing
```javascript
// Test complete workflows
test('complete formula entry, validation, and evaluation workflow', async () => {
  // ... test entire user journey
});
```

## 🔧 Configuration

### Jest Configuration (`jest.config.json`)
- Uses `jest-expo` preset for React Native compatibility
- Custom setup file for mocks and global configuration
- Coverage thresholds and reporting
- Transform ignore patterns for React Native modules

### Test Setup (`testSetup.js`)
- React Native module mocks
- Global test utilities
- Console log suppression
- Expo and library mocks

## 📊 Test Reports

### Coverage Report
```bash
npm run test:coverage
```
Generates detailed coverage reports in multiple formats:
- HTML report: `coverage/lcov-report/index.html`
- JSON report: `coverage/coverage-final.json`
- Text summary in terminal

### Test Results
```bash
# Verbose output with detailed test information
npm test -- --verbose

# Silent mode for CI
npm run test:ci
```

## 🐛 Debugging Tests

### Common Issues and Solutions

#### 1. React Native Module Errors
```javascript
// Solution: Add to testSetup.js
jest.mock('react-native-module-name', () => ({
  // Mock implementation
}));
```

#### 2. Async Operation Testing
```javascript
// Use waitFor for async operations
await waitFor(() => {
  expect(screen.getByText('Expected Text')).toBeTruthy();
});
```

#### 3. Component Not Rendering
```javascript
// Check if component is properly imported and mocked
import { render, screen } from '@testing-library/react-native';
```

### Debug Mode
```bash
# Run specific test with debug info
npm test -- --testNamePattern="specific test name" --verbose
```

## 🔄 Continuous Integration

### GitHub Actions Example
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:ci
```

### Test Commands for CI
```bash
# Install dependencies
npm ci

# Run tests with coverage
npm run test:ci

# Upload coverage to service
# (configure with codecov, coveralls, etc.)
```

## 📈 Best Practices

### 1. Test Organization
- Group related tests in describe blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

### 2. Mock Management
- Mock external dependencies consistently
- Use beforeEach to reset mocks
- Keep mocks close to test files when possible

### 3. Assertion Strategy
- Use specific assertions over generic ones
- Test behavior, not implementation
- Include both positive and negative test cases

### 4. Performance
- Avoid unnecessary re-renders in tests
- Use appropriate cleanup in afterEach
- Mock heavy operations

## 🔮 Future Enhancements

### Planned Improvements
- [ ] Visual regression testing
- [ ] E2E testing with Detox
- [ ] Performance testing
- [ ] Accessibility testing
- [ ] Cross-platform testing (iOS/Android/Web)

### Additional Test Types
- [ ] Snapshot testing for UI consistency
- [ ] Property-based testing for formula validation
- [ ] Load testing for large datasets
- [ ] Memory leak detection

## 📞 Support

For questions about testing:
1. Check this documentation
2. Review existing test examples
3. Run `./tests/run-tests.sh --help` for script options
4. Check Jest and React Native Testing Library documentation

## 📝 Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure coverage thresholds are met
3. Update this documentation if needed
4. Run full test suite before committing
