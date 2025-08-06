# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies for client
COPY client/package*.json ./client/
RUN cd client && npm install

# Install dependencies for server
COPY server/package*.json ./server/
RUN cd server && npm install

# Copy source code
COPY . .

# Build client
RUN cd client && npm run build

# Create data directory for persistent database storage
RUN mkdir -p /app/data

# Set database path to persistent volume
ENV DATABASE_PATH=/app/data/choreworld.db

# Expose port
EXPOSE 3000

# Start server
CMD ["sh", "-c", "cd server && npm start"]