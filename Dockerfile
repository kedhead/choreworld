# Use Node.js LTS version
FROM node:18-alpine

# Set working directory to server directory
WORKDIR /app/server

# Copy server package files first
COPY server/package*.json ./
RUN npm install

# Copy client package files and build
COPY client/package*.json ../client/
RUN cd ../client && npm install

# Copy all source code
COPY . ..

# Build client
RUN cd ../client && npm run build

# Create data directory for persistent database storage
RUN mkdir -p /app/data

# Set database path to persistent volume
ENV DATABASE_PATH=/app/data/choreworld.db

# Expose port
EXPOSE 3000

# Start server directly
CMD ["npm", "start"]