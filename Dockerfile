# Use Node.js LTS version
FROM node:18-alpine

# Set working directory to server
WORKDIR /app/server

# Copy server package files
COPY server/package*.json ./

# Install server dependencies first
RUN npm install

# Copy server source code
COPY server/ ./

# Create data directory for persistent database storage
RUN mkdir -p /app/data

# Set environment variables
ENV DATABASE_PATH=/app/data/choreworld.db
ENV PORT=${PORT:-10000}

# Expose the port
EXPOSE $PORT

# Start the server directly
CMD ["npm", "start"]