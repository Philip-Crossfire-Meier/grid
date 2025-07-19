# Use Node.js LTS version with security updates
FROM node:20-alpine3.20

# Set working directory
WORKDIR /app

# Install system dependencies for better security and debugging
RUN apk add --no-cache curl

# Install Expo CLI globally
RUN npm install -g @expo/cli@latest

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Expose port for Expo development server
EXPOSE 8081
EXPOSE 19000
EXPOSE 19001
EXPOSE 19002

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8081/ || exit 1

# Start the development server directly
CMD ["npx", "expo", "start", "--tunnel", "--clear"]
