#!/bin/bash

# Test Runner Script for React Grid Project
# This script provides various testing options with proper setup

echo "🧪 React Grid Test Suite"
echo "========================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if dependencies are installed
check_dependencies() {
    print_status "Checking test dependencies..."
    
    if ! npm list jest-expo >/dev/null 2>&1; then
        print_warning "Test dependencies not found. Installing..."
        npm install --save-dev @testing-library/react-native @testing-library/jest-native jest jest-expo react-test-renderer
        
        if [ $? -eq 0 ]; then
            print_success "Dependencies installed successfully"
        else
            print_error "Failed to install dependencies"
            exit 1
        fi
    else
        print_success "All dependencies are installed"
    fi
}

# Run specific test suites
run_component_tests() {
    print_status "Running component tests..."
    npm test -- tests/components/ --verbose
}

run_utils_tests() {
    print_status "Running utility tests..."
    npm test -- tests/utils/ --verbose
}

run_integration_tests() {
    print_status "Running integration tests..."
    npm test -- tests/components/EditableGrid.integration.test.js --verbose
}

run_all_tests() {
    print_status "Running all tests..."
    npm test
}

run_coverage() {
    print_status "Running tests with coverage report..."
    npm run test:coverage
}

run_watch_mode() {
    print_status "Starting test watch mode..."
    npm run test:watch
}

# Main menu
show_menu() {
    echo ""
    echo "Choose an option:"
    echo "1) Run all tests"
    echo "2) Run component tests only"
    echo "3) Run utility tests only"
    echo "4) Run integration tests only"
    echo "5) Run tests with coverage"
    echo "6) Start watch mode"
    echo "7) Check dependencies"
    echo "8) Exit"
    echo ""
}

# Main execution
main() {
    while true; do
        show_menu
        read -p "Enter your choice (1-8): " choice
        
        case $choice in
            1)
                check_dependencies
                run_all_tests
                ;;
            2)
                check_dependencies
                run_component_tests
                ;;
            3)
                check_dependencies
                run_utils_tests
                ;;
            4)
                check_dependencies
                run_integration_tests
                ;;
            5)
                check_dependencies
                run_coverage
                ;;
            6)
                check_dependencies
                run_watch_mode
                ;;
            7)
                check_dependencies
                ;;
            8)
                print_success "Exiting test runner"
                exit 0
                ;;
            *)
                print_error "Invalid option. Please choose 1-8."
                ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
    done
}

# Handle command line arguments
if [ $# -eq 0 ]; then
    main
else
    case $1 in
        --all)
            check_dependencies && run_all_tests
            ;;
        --components)
            check_dependencies && run_component_tests
            ;;
        --utils)
            check_dependencies && run_utils_tests
            ;;
        --integration)
            check_dependencies && run_integration_tests
            ;;
        --coverage)
            check_dependencies && run_coverage
            ;;
        --watch)
            check_dependencies && run_watch_mode
            ;;
        --help)
            echo "Usage: $0 [option]"
            echo "Options:"
            echo "  --all          Run all tests"
            echo "  --components   Run component tests only"
            echo "  --utils        Run utility tests only"
            echo "  --integration  Run integration tests only"
            echo "  --coverage     Run tests with coverage"
            echo "  --watch        Start watch mode"
            echo "  --help         Show this help"
            ;;
        *)
            print_error "Unknown option: $1"
            echo "Use --help for available options"
            exit 1
            ;;
    esac
fi
