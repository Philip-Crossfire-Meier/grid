# React Native Editable Grid App

A React Native application built with Expo featuring an advanced editable data grid with formula support, comprehensive testing, and Docker containerization. Perfect for medical data management and spreadsheet-like functionality.

## ✨ Features

- **Advanced Editable Grid**: Tap any cell to edit with formula support and validation
- **Formula Engine**: Excel-like formulas with SUM, AVERAGE, and cell references
- **Python Backend**: Flask-based formula evaluation server with dependency tracking
- **Comprehensive Testing**: 77+ tests with 100% pass rate using Jest and Testing Library
- **Add/Delete Rows & Columns**: Dynamic grid management with user confirmation  
- **Header Editing**: Customizable column headers (except ID column)
- **Formula Mode**: Visual feedback for formula cells with syntax highlighting
- **Docker Support**: Complete containerization for both frontend and backend
- **Real-time Updates**: Immediate visual feedback for all data changes

## 🏗️ Project Structure

```
React-Grid/
├── App.js                      # Main application component
├── components/
│   ├── EditableGrid.js         # Advanced editable grid component
│   ├── EditableGridStyles.js   # Grid styling and themes
│   ├── FormulaEngine.js        # Client-side formula handling
│   └── FormulaEngineClient.js  # Backend communication
├── backend/                    # Python Flask formula server
│   ├── app.py                  # Main Flask application
│   ├── enhanced_formula_engine.py # Advanced formula evaluation
│   ├── dependency_graph.py     # Formula dependency tracking
│   ├── formula_parser.py       # Formula parsing and validation
│   └── requirements.txt        # Python dependencies
├── tests/                      # Comprehensive test suite
│   ├── components/             # Component tests
│   ├── utils/                  # Test utilities and helpers
│   └── setup/                  # Test configuration
├── Dockerfile                  # Frontend container configuration
├── docker-compose.yml          # Multi-container orchestration
└── .github/
    └── copilot-instructions.md # Development guidelines
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.12+ (for backend formula engine)
- Docker and Docker Compose (for containerized development)

### Local Development

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd React-Grid
   npm install
   ```

2. **Start the Python backend:**
   ```bash
   cd backend
   pip install -r requirements.txt
   python app.py
   ```

3. **Start the React Native frontend:**
   ```bash
   npm start
   # or
   npx expo start
   ```

### Docker Development (Recommended)

1. **Build and run the full stack:**
   ```bash
   docker compose up --build
   ```

2. **Access the application:**
   - Frontend: Expo development server on port 8081
   - Backend: Flask API server on port 8000

### Testing

Run the comprehensive test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode  
npm test -- --watch

# Run specific test file
npm test EditableGrid.test.js

# Generate coverage report
npm test -- --coverage
```

**Test Results:** ✅ 77 tests passing (100% success rate)

### Available Scripts

- `npm start` - Start the Expo development server
- `npm test` - Run the comprehensive test suite  
- `npm test -- --watch` - Run tests in watch mode
- `npm test -- --coverage` - Generate test coverage report
- `npm run android` - Start with Android simulator
- `npm run ios` - Start with iOS simulator  
- `npm run web` - Start web version

## 📊 Usage

### Grid Operations

- **Edit Cell**: Tap any cell to enter edit mode
- **Formula Entry**: Start with `=` to enter formula mode
- **Save Changes**: Press Enter to save and validate
- **Cancel Edit**: Press Escape or tap outside to cancel
- **Add Row**: Use the "Add Row" button in the header
- **Add Column**: Use the "Add Column" button to expand the grid
- **Header Editing**: Click column headers to rename (except ID column)

### Formula Support

The grid supports Excel-like formulas:

- **Cell References**: `=A1`, `=B2`, `=C3`
- **Range Operations**: `=SUM(A1:A5)`, `=AVERAGE(B1:B10)`
- **Arithmetic**: `=A1+B1`, `=A1*2`, `=A1-B1`, `=A1/B1`
- **Mixed Formulas**: `=SUM(A1:A3)+B1*2`

### Formula Examples

```
=SUM(A1:A5)           # Sum of range A1 to A5
=AVERAGE(B1:B10)      # Average of range B1 to B10  
=A1+B1                # Add two cells
=A1*1.2               # Multiply by constant
=SUM(A1:A3)+B1        # Complex formula
```

### Data Structure

The grid displays medical session data with customizable fields:
- **ID**: Auto-generated unique identifier (read-only)
- **Session Hours**: Patient session duration (editable, supports formulas)
- **Rate per Hour**: Hourly rate (editable, supports formulas)
- **Margin**: Profit margin calculation (editable, supports formulas)
- **Total Cost**: Calculated total (editable, supports formulas)

## 🐳 Docker Configuration

### Frontend Dockerfile
- Based on Node.js 20 Alpine for security and performance
- Exposes ports 8081, 19000-19002 for Expo development server
- Includes Expo CLI and all project dependencies
- Optimized for development with hot reloading

### Backend Dockerfile  
- Python 3.12 slim image for formula engine
- Flask server with CORS support
- Advanced formula parsing and evaluation
- Dependency tracking and circular reference detection

### docker-compose.yml
- Multi-container orchestration for full-stack development
- Frontend and backend service coordination
- Volume mounting for live code changes
- Network configuration for service communication
- Environment variables for cross-container access

## 🧪 Testing Architecture

### Test Coverage
- **77 tests** with **100% pass rate**
- **Component Tests**: EditableGrid functionality and behavior
- **Integration Tests**: Full user workflow testing
- **Unit Tests**: Individual component and utility testing
- **Formula Tests**: Comprehensive formula engine validation

### Test Structure
```
tests/
├── components/
│   ├── EditableGrid.test.js         # Main grid component tests
│   ├── EditableGrid.integration.test.js # User workflow tests
│   ├── App.test.js                  # Application-level tests
│   └── FormulaEngineClient.test.js  # API client tests
├── utils/
│   ├── formulaValidation.test.js    # Formula validation tests
│   └── testHelpers.js               # Shared test utilities
└── setup/
    └── testSetup.js                 # Jest configuration
```

### Test Utilities
- **Helper Functions**: `getFirstEditableCell()`, `enterEditMode()`
- **Mock Services**: FormulaEngineClient mocking
- **Async Testing**: Comprehensive `waitFor()` patterns
- **User Interaction**: Realistic user event simulation

## 💻 Technologies Used

### Frontend
- **React Native**: Cross-platform mobile app framework
- **Expo**: Development platform and toolchain
- **React Hooks**: Modern state management (useState, useEffect)
- **Testing Library**: Component testing with user interaction simulation
- **Jest**: Test runner with comprehensive assertion library

### Backend  
- **Python 3.12**: Modern Python with type hints
- **Flask**: Lightweight web framework with CORS support
- **Formula Engine**: Custom parser with dependency tracking
- **Regex Parsing**: Advanced formula syntax validation

### DevOps & Tooling
- **Docker**: Multi-container development environment
- **Docker Compose**: Full-stack orchestration
- **GitHub Copilot**: AI-assisted development with custom instructions
- **ESLint/Prettier**: Code formatting and linting

### Testing Framework
- **Jest**: Test runner and assertion library
- **React Native Testing Library**: Component testing utilities
- **Mock Functions**: Service and API mocking
- **Async Testing**: Promise-based test patterns

## 🏗️ Architecture

### Frontend Architecture
```
App.js
└── EditableGrid.js (Main Grid Component)
    ├── EditableGridStyles.js (Styling)
    ├── FormulaEngine.js (Client Logic)
    └── FormulaEngineClient.js (API Communication)
```

### Backend Architecture  
```
Flask App (app.py)
├── Enhanced Formula Engine (formula evaluation)
├── Dependency Graph (circular reference detection)
├── Formula Parser (syntax validation)
└── CORS Handler (cross-origin requests)
```

### Data Flow
1. **User Input** → Grid cell edit mode
2. **Formula Detection** → Client-side validation  
3. **API Request** → Backend formula evaluation
4. **Dependency Check** → Circular reference detection
5. **Result Return** → Grid cell update
6. **State Update** → UI re-render

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** with comprehensive tests
4. **Run the test suite**: `npm test` (ensure all 77 tests pass)
5. **Test manually** with Expo Go app
6. **Submit a pull request** with detailed description

### Development Guidelines
- Use React Native best practices and functional components
- Maintain responsive design for various screen sizes  
- Follow Expo development patterns and conventions
- Write tests for new features using Testing Library patterns
- Use helper functions from `testHelpers.js` for consistency
- Implement proper error handling and user feedback
- Follow the established formula syntax patterns

### Code Style
- Use functional components with React hooks
- Implement proper TypeScript-style prop validation
- Follow the established file structure and naming conventions
- Write descriptive test names and comprehensive assertions
- Use the established mock patterns for external services

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

## 🔧 Troubleshooting

### Common Issues

1. **Metro bundler not starting**: 
   ```bash
   npx expo start --clear
   ```

2. **Tests failing after changes**:
   ```bash
   npm test -- --verbose
   # Check for async timing issues or mock problems
   ```

3. **Backend connection issues**:
   ```bash
   # Check if Flask server is running
   curl http://localhost:5000/health
   ```

4. **Docker build fails**: 
   - Ensure Docker has sufficient memory allocated (>4GB)
   - Clear Docker cache: `docker system prune`

5. **Cannot connect to development server**: 
   - Check that ports 19000-19002 and 5000 are not blocked
   - Verify network connectivity between containers

6. **Module resolution errors**: 
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

7. **Formula evaluation errors**:
   - Check backend logs: `docker-compose logs backend`
   - Verify formula syntax matches supported patterns
   - Check for circular references in formulas

### Performance Tips

- Use Docker Compose for full-stack development
- Run tests in watch mode during development: `npm test -- --watch`
- Use `npx expo start --clear` to clear Metro cache when needed
- Monitor backend performance with formula complexity

### Getting Help

- **Expo Documentation**: [docs.expo.dev](https://docs.expo.dev/)
- **React Native Docs**: [reactnative.dev/docs](https://reactnative.dev/docs/getting-started)
- **Testing Library**: [testing-library.com](https://testing-library.com/docs/react-native-testing-library/intro)
- **Flask Documentation**: [flask.palletsprojects.com](https://flask.palletsprojects.com/)
- **Project Issues**: Search existing issues on the repository

---

