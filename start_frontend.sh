#!/bin/bash
# Start the Network Security Dashboard frontend
# Usage: ./start_frontend.sh

set -e

cd "$(dirname "$0")/frontend"

# Check for Node.js
if ! command -v node &> /dev/null; then
  echo "Node.js is not installed. Please install Node.js 14 or higher."
  exit 1
fi

# Install dependencies if node_modules does not exist
if [ ! -d "node_modules" ]; then
  echo "Installing frontend dependencies..."
  npm install
fi

echo "Starting frontend development server..."
npm run dev 