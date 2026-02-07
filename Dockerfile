# Simple single-stage Dockerfile for Next.js
FROM node:22-alpine

# Install dependencies for native modules
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies using package-lock.json
RUN npm ci

# Copy all application files
COPY . .

# Create public directory if it doesn't exist
RUN mkdir -p public

# Set build-time environment variable
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

# Set runtime environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]