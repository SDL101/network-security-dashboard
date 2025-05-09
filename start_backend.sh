#!/bin/bash
# Start the Network Security Dashboard backend
# Usage: ./start_backend.sh

set -e

cd "$(dirname "$0")/backend"

# Check for Python 3
if ! command -v python3 &> /dev/null; then
  echo "Python 3 is not installed. Please install Python 3.8 or higher."
  exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
  echo "Creating virtual environment..."
  python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

echo "Starting backend server (requires sudo for packet sniffing)..."
echo "You may be prompted for your password."
sudo python3 packet_sniffer.py 