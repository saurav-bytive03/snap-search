#!/bin/bash

# Exit immediately if any command fails
set -e

echo "🚀 Starting backend and frontend..."

# Run backend
echo "📦 Installing and starting backend..."
cd backend
npm install
npm run dev &    # Run backend in background

# Go to frontend
echo "🧩 Installing and starting frontend..."
cd ../frontend
npm install
npm run dev &    # Run frontend in background

# Wait for both to run
wait
