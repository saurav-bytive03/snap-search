FROM node:18
WORKDIR /app

# Copy and install backend
COPY backend ./backend
RUN cd backend && npm install

# Copy and install frontend
COPY frontend ./frontend
RUN cd frontend && npm install && npm run build

# Install concurrently globally
RUN npm install -g concurrently

EXPOSE 8000 4173

CMD concurrently "cd backend && npm run dev" "cd frontend && npm run start"
