# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./backend/
COPY backend/tsconfig.json ./backend/

# Install backend dependencies
WORKDIR /app/backend
RUN npm ci

# Copy backend source
COPY backend/src ./src

# Build backend
RUN npm run build

# Copy frontend package files
WORKDIR /app
COPY frontend/package*.json ./frontend/
COPY frontend/tsconfig.json ./frontend/
COPY frontend/vite.config.ts ./frontend/
COPY frontend/postcss.config.js ./frontend/
COPY frontend/tailwind.config.js ./frontend/
COPY frontend/index.html ./frontend/

# Install frontend dependencies
WORKDIR /app/frontend
RUN npm ci

# Copy frontend source
COPY frontend/src ./src
COPY frontend/index.css ./

# Build frontend
RUN npm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

# Copy backend build and dependencies
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/backend/package*.json ./backend/

# Copy frontend build
COPY --from=builder /app/frontend/dist ./frontend/dist

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000
ENV SERVE_STATIC=true

# Expose port
EXPOSE 5000

# Start the backend server
WORKDIR /app/backend
CMD ["npm", "start"]
