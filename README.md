# React Native Editable Grid App

A React Native application built with Expo featuring an editable data grid with formula support.

Quick start:
  ```bash
   docker compose up --build
   ```

The frontend will then be available at [localhost:8081](http://localhost:8081/). Make sure the ports 8081 and 8000 (the backend port) are not in use. Make sure the docker daemon is running before composing.

Approach:

- The code uses React for the frontend and Python for the backend.
- The backend evaluates formulas using a custom graph which runs a topological sort.
- Cyclical references are indicated to the user.
- Communication between frontend and backend is facilitated via REST

Notes and assumptions:

- This is a mockup and not a refined solution (indicated by the 2 hour time limit).
- This is a programming excercise. In real-world product development I would have suggested to look into off-the-shelf solutions first, for example AG Grid, Airtable, MUI, etc. 
- Since Frontera uses React and Python the purpose of the excercise is to test familiarity with these technologies. Again, in real-world product development using for example streamlit might be an option which would greatly reduce overall complexity and LOC.
- The code is not optimized for security (e.g. no input checking, no authentication or authorization, no supply chain auditing). 

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

### Docker Development 

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

### Formula Support

The grid supports Excel-like formulas:

- **Cell References**: `=A1`, `=B2`, `=C3`
- **Range Operations**: `=SUM(A1:A5)`, `=AVERAGE(B1:B10)`
- **Arithmetic**: `=A1+B1`, `=A1*2`, `=A1-B1`, `=A1/B1`
- **Mixed Formulas**: `=SUM(A1:A3)+B1*2`

### Formula Examples

```
=SUM(A1:A5)           # Sum of range A1 to A5
=SUM(A1,B1,C1)        # Sum of individual cells (comma-separated)
=AVERAGE(B1:B10)      # Average of range B1 to B10  
=AVERAGE(A1,B1,C1)    # Average of individual cells (comma-separated)
=A1+B1                # Add two cells
=A1*1.2               # Multiply by constant
=SUM(A1:A3)+B1        # Complex formula
```

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

