# Use Node.js LTS version
FROM node:18-alpine

# Set working directory to app root
WORKDIR /app

# Copy package files
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install server dependencies
RUN cd server && npm install

# Install client dependencies and build
RUN cd client && npm install
COPY client/ ./client/
RUN cd client && npm run build

# Copy server source code
COPY server/ ./server/

# Create data directory for persistent database storage
RUN mkdir -p /app/data

# Set database path to persistent volume
ENV DATABASE_PATH=/app/data/choreworld.db

# Expose port
EXPOSE 3000

# Start server from server directory
CMD ["sh", "-c", "cd server && npm start"]