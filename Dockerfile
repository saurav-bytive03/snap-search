# Use Node.js LTS
FROM node:18

WORKDIR /app

# Copy all files
COPY . .

# Install dependencies for backend
WORKDIR /app/backend
RUN npm install

# Install dependencies for frontend
WORKDIR /app/frontend
RUN npm install && npm run build

# Install concurrently globally to run both
RUN npm install -g concurrently

# Expose backend (8000) and frontend (4173)
EXPOSE 8000 4173

# Run both backend and frontend simultaneously
CMD concurrently \
    "cd /app/backend && npm run dev" \
    "cd /app/frontend && npm run start"
