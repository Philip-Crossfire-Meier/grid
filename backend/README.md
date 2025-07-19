# Formula Engine Backend API

A Python-based REST API service for evaluating Excel-style formulas in spreadsheet data.

## Features

- **Excel-style formula evaluation**: SUM, AVERAGE, cell references, arithmetic operations
- **REST API**: HTTP endpoints for formula processing
- **Error handling**: Comprehensive error handling with meaningful messages
- **CORS support**: Cross-origin requests enabled for React Native frontend
- **Docker support**: Containerized deployment
- **Health checks**: Built-in health monitoring
- **Input validation**: Request validation and sanitization

## API Endpoints

### 1. Evaluate Formulas
**POST** `/api/evaluate-formulas`

Processes spreadsheet data and evaluates all formulas.

**Request Body:**
```json
{
  "data": [
    {"id": 1, "col_a": "10", "col_b": "20", "col_c": "=A1+B1"},
    {"id": 2, "col_a": "15", "col_b": "25", "col_c": "=SUM(A1:A2)"}
  ],
  "columns": [
    {"key": "id", "title": "ID", "width": 60, "editable": false},
    {"key": "col_a", "title": "A", "width": 140, "editable": true},
    {"key": "col_b", "title": "B", "width": 60, "editable": true},
    {"key": "col_c", "title": "C", "width": 180, "editable": true}
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "message": "Formulas evaluated successfully",
  "timestamp": 1642784400.123,
  "processed_rows": 2,
  "processed_columns": 4
}
```

### 2. Validate Formula
**POST** `/api/validate-formula`

Validates formula syntax without evaluation.

### 3. Supported Functions
**GET** `/api/supported-functions`

Returns list of available formula functions.

### 4. Health Check
**GET** `/health`

Service health status.

## Supported Formulas

- **SUM**: `=SUM(A1:A5)` - Sum of range
- **AVERAGE**: `=AVERAGE(A1:A5)` - Average of range  
- **Cell References**: `=A1`, `=B2` - Individual cell values
- **Arithmetic**: `=A1+B1`, `=A1*2`, `=A1/B1-C1` - Basic math operations

## Installation & Setup

### Option 1: Local Development

1. **Install Python dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Run the development server:**
   ```bash
   python app.py
   ```

3. **Server will start on:** `http://localhost:8000`

### Option 2: Docker Deployment

1. **Build the Docker image:**
   ```bash
   cd backend
   docker build -t formula-engine-api .
   ```

2. **Run the container:**
   ```bash
   docker run -p 8000:8000 formula-engine-api
   ```

### Option 3: Docker Compose (Recommended)

Add to your existing `docker-compose.yml`:

```yaml
services:
  formula-api:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - FLASK_ENV=production
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## Integration with React Native

Update the FormulaEngine in your React Native app to call this API:

```javascript
// Replace the client-side FormulaEngine with API calls
const evaluateFormulas = async (data, columns) => {
  try {
    const response = await fetch('http://localhost:8000/api/evaluate-formulas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data, columns })
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
};
```

## Error Handling

The API returns standardized error responses:

```json
{
  "success": false,
  "error": "Error description",
  "message": "User-friendly error message"
}
```

## Performance

- **Processing time**: ~500ms simulated delay for realistic backend feel
- **Concurrent requests**: Supports multiple workers via Gunicorn
- **Memory efficient**: Processes data in streaming fashion
- **Scalable**: Stateless design allows horizontal scaling

## Security

- Input validation and sanitization
- CORS configuration for frontend integration
- No SQL injection risks (no database dependencies)
- Error message sanitization

## Development

### Running Tests
```bash
python -m pytest tests/
```

### Code Formatting
```bash
black *.py
flake8 *.py
```

### Environment Variables
- `FLASK_ENV`: Set to 'production' for production deployment
- `LOG_LEVEL`: Logging level (DEBUG, INFO, WARNING, ERROR)

## Troubleshooting

1. **CORS Issues**: Ensure frontend URL is in CORS configuration
2. **Port Conflicts**: Change port in app.py if 8000 is busy
3. **Dependencies**: Run `pip install -r requirements.txt` to install all deps
4. **Docker Issues**: Check Docker daemon is running

## API Testing

Use curl to test the API:

```bash
# Health check
curl http://localhost:8000/health

# Evaluate formulas
curl -X POST http://localhost:8000/api/evaluate-formulas \
  -H "Content-Type: application/json" \
  -d '{"data":[{"id":1,"col_a":"10","col_b":"=A1*2"}],"columns":[{"key":"id","title":"ID"},{"key":"col_a","title":"A"},{"key":"col_b","title":"B"}]}'
```
