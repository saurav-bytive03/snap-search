# Base image
FROM node:18 AS base
WORKDIR /app

# ===== Backend Stage =====
FROM base AS backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend .
EXPOSE 8000
CMD ["npm", "run", "dev"]

# ===== Frontend Stage =====
FROM base AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend .
RUN npm run build
EXPOSE 4173
CMD ["npm", "run", "start"]
