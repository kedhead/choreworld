# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy root package files
COPY package*.json ./

# Install root dependencies
RUN npm install

# Copy client package files
COPY client/package*.json ./client/

# Install client dependencies  
RUN cd client && npm install --legacy-peer-deps

# Copy client source code
COPY client/ ./client/

# Build the client
RUN cd client && npm run build

# Copy server package files
COPY server/package*.json ./server/

# Install server dependencies
RUN cd server && npm install

# Copy server source code
COPY server/ ./server/

# Create data directory for persistent database storage
RUN mkdir -p /app/data

# Set environment variables
ENV DATABASE_PATH=/app/data/choreworld.db
ENV PORT=${PORT:-10000}

# Expose the port
EXPOSE $PORT

# Start the server from root directory
CMD ["npm", "start"]