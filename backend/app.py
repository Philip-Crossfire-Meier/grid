"""
Updated Flask app to use the enhanced formula engine with dependency graph.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import sys
import os

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Try to import the enhanced engine, fallback to original if needed
try:
    from enhanced_formula_engine import EnhancedFormulaEngine
    USE_ENHANCED_ENGINE = True
    print("Using Enhanced Formula Engine with dependency graph")
except ImportError as e:
    print(f"Enhanced engine not available ({e}), using original engine")
    from formula_engine import FormulaEngine
    USE_ENHANCED_ENGINE = False

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Initialize the formula engine
if USE_ENHANCED_ENGINE:
    formula_engine = EnhancedFormulaEngine()
else:
    formula_engine = FormulaEngine()

@app.before_request
def before_request():
    headers = {'Access-Control-Allow-Origin': '*',
               'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
               'Access-Control-Allow-Headers': 'Content-Type'}
    if request.method.lower() == 'options':
        return jsonify(headers), 200

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    engine_type = "Enhanced" if USE_ENHANCED_ENGINE else "Original"
    return jsonify({
        'status': 'healthy',
        'message': f'{engine_type} Formula Engine API is running',
        'version': '2.0.0' if USE_ENHANCED_ENGINE else '1.0.0',
        'enhanced': USE_ENHANCED_ENGINE
    })

@app.route('/api/formulas/evaluate', methods=['POST'])
def evaluate_formulas():
    """Evaluate formulas using the available engine."""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        if 'data' not in data or 'columns' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required fields: data and columns'
            }), 400
        
        grid_data = data['data']
        columns = data['columns']
        
        logger.info(f"Evaluating formulas for grid with {len(grid_data)} rows and {len(columns)} columns")
        
        # Use the available formula engine
        result = formula_engine.evaluate_formulas(grid_data, columns)
        
        # Add additional info for enhanced engine
        if USE_ENHANCED_ENGINE and result.get('success'):
            try:
                result['dependency_info'] = formula_engine.get_dependency_graph_info()
            except Exception as e:
                logger.warning(f"Could not get dependency info: {e}")
        
        logger.info(f"Formula evaluation completed: {result.get('message', 'Unknown status')}")
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in evaluate_formulas: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Internal server error during formula evaluation'
        }), 500

@app.route('/api/formulas/validate', methods=['POST'])
def validate_formula():
    """Validate a single formula."""
    try:
        data = request.get_json()
        
        if not data or 'formula' not in data:
            return jsonify({
                'isValid': False,
                'error': 'No formula provided'
            }), 400
        
        formula = data['formula']
        
        # Basic validation (works with both engines)
        if not formula.strip():
            return jsonify({
                'isValid': False,
                'error': 'Empty formula'
            })
        
        if not formula.startswith('='):
            return jsonify({
                'isValid': False,
                'error': 'Formula must start with ='
            })
        
        # Enhanced validation if available
        if USE_ENHANCED_ENGINE:
            try:
                is_valid, error_message = formula_engine.formula_parser.validate_formula_syntax(formula)
                
                if not is_valid:
                    return jsonify({
                        'isValid': False,
                        'error': error_message
                    })
                
                # Extract dependencies
                dependencies = formula_engine.formula_parser.extract_dependencies(formula)
                
                return jsonify({
                    'isValid': True,
                    'dependencies': [str(dep) for dep in dependencies]
                })
            except Exception as e:
                logger.error(f"Enhanced validation failed: {e}")
        
        # Basic validation fallback
        return jsonify({
            'isValid': True,
            'message': 'Basic validation passed'
        })
        
    except Exception as e:
        logger.error(f"Error in validate_formula: {str(e)}")
        return jsonify({
            'isValid': False,
            'error': f'Validation error: {str(e)}'
        }), 500

if __name__ == '__main__':
    logger.info("Starting Formula Engine API server...")
    app.run(host='0.0.0.0', port=8000, debug=True)