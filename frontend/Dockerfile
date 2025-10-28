# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy the .env file to the working directory
COPY .env .env

# Install dependencies
RUN npm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built app from builder stage
COPY --from=builder /app/dist ./dist

# Copy nginx configuration (optional - nginx default works for most SPAs)
# COPY nginx.conf /etc/nginx/conf.d/default.conf
# Expose port
EXPOSE 5173

# Start nginx
CMD ["npm", "run", "dev"]

 