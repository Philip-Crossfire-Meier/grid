<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a React Native project using Expo with an editable data grid component. The project is containerized with Docker for easy deployment and development.

## Project Structure
- **App.js**: Main application component
- **components/EditableGrid.js**: Custom editable data grid component
- **Dockerfile**: Container configuration for running the app
- **docker-compose.yml**: Multi-container setup for development

## Key Features
- Editable data grid with tap-to-edit functionality
- Add/delete rows dynamically
- Responsive design for mobile devices
- Docker containerization for consistent development environment

## Development Guidelines
- Use React Native best practices and components
- Maintain responsive design for various screen sizes
- Follow Expo development patterns
- Use functional components with React hooks
- Implement proper error handling and user feedback

## Running the Project
- Local development: `npm start` or `npx expo start`
- Docker development: `docker-compose up --build`
- Access the app via Expo Go app on mobile device
