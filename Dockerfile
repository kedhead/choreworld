# Use Node.js LTS version
FROM node:18-alpine

# Set working directory to app root
WORKDIR /app

# Copy root package.json first
COPY package.json ./

# Copy all package files
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Copy source code
COPY server/ ./server/
COPY client/ ./client/

# Install server dependencies
RUN cd server && npm install

# Install client dependencies and build
RUN cd client && npm install && npm run build

# Create data directory for persistent database storage
RUN mkdir -p /app/data

# Set database path to persistent volume
ENV DATABASE_PATH=/app/data/choreworld.db

# Expose port
EXPOSE 3000

# Start server from server directory
CMD ["sh", "-c", "cd server && npm start"]