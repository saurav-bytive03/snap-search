FROM node:18
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Build frontend
RUN npm run build

# Serve built frontend
EXPOSE 4173
CMD ["npm", "run", "start"]
