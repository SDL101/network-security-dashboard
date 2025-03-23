
# Network Security Monitoring Dashboard

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A real-time network traffic analysis tool that provides instant visibility into network events, security threats, and connection patterns through an interactive web dashboard. Monitor your network traffic, detect potential security risks, and analyze connection patterns all in one place.

![image](https://github.com/user-attachments/assets/ec4b617d-1101-4c9f-a497-35f7b724b001)


## Features

- **Real-time Packet Capture**: Monitor network traffic as it happens
- **Threat Detection**: Automatically identify potential security threats including:
  - Port scanning attempts
  - Suspicious large packets
  - Unusual external connections
- **Interactive Dashboard**: Filter, search, and analyze network events
- **Data Persistence**: All logs are stored in SQLite database for historical analysis
- **Export Capability**: Download logs as CSV for external analysis

## Architecture

```
network-security-dashboard/
├── README.md                    # Project documentation
├── backend/                     # Python backend
│   ├── app.py                   # Flask application
│   ├── database.py              # Database models
│   ├── instance/                # Flask instance folder
│   │   └── network_logs.db      # SQLite database
│   ├── packet_sniffer.py        # Packet capture engine
│   ├── requirements.txt         # Python dependencies
│   └── routes.py                # API endpoints
└── frontend/                    # Vue.js frontend
    ├── index.html               # HTML entry point
    ├── package-lock.json        # NPM lock file
    ├── package.json             # NPM configuration
    ├── src/                     # Source code directory
    │   ├── App.vue              # Root Vue component
    │   ├── assets/              # Static assets
    │   │   └── styles.css       # Global styles
    │   ├── components/          # Vue components
    │   │   ├── CaptureControls.vue  # Control buttons
    │   │   ├── ConnectionStatus.vue # Connection indicator
    │   │   ├── FilterPanel.vue      # Log filtering
    │   │   ├── LogsTable.vue        # Network logs display
    │   │   └── StatPanel.vue        # Network statistics
    │   ├── main.js              # JavaScript entry point
    │   └── stores/              # Pinia state management
    │       └── networkStore.js  # Network state
    └── vite.config.js           # Vite configuration
```

## Requirements

- **Python 3.8+** - For backend packet capture and analysis
- **Node.js 14+** - For frontend development and build
- **Administrator/Root privileges** - Required for packet sniffing

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourname/network-security-dashboard.git
cd network-security-dashboard
```

### 2. Set Up the Backend

```bash
# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt
```

### 3. Set Up the Frontend

```bash
cd frontend
npm install
```

## Running the Application

The application has two components that need to be run separately:

### 1. Start the Backend (Packet Capture Engine)

```bash
# From the project root, with virtual environment activated
# On Windows (with admin privileges):
python backend/packet_sniffer.py

# On macOS/Linux:
sudo python backend/packet_sniffer.py
```

The backend will start on http://localhost:5000

### 2. Start the Frontend Development Server

```bash
# In a new terminal
cd frontend
npm run dev
```

The frontend will be available at http://localhost:8000 (or the URL displayed in your terminal)

## Usage Guide

### Capturing Network Traffic

1. Open the dashboard in your browser
2. Click the "Start Capture" button to begin monitoring
3. Network events will appear in real-time in the logs table
4. Click "Stop Capture" to pause monitoring

### Analyzing Events

- Use the dropdown filters to view specific event types:
  - High Severity - Critical security events
  - Medium Severity - Potential concerns
  - Low Severity - Normal traffic
  - Port Scans - Potential reconnaissance activity
  - External Connections - Traffic to non-private IPs
  - Normal Traffic - Regular network activity

- Events are color-coded by type:
  - Red: Network scans (potential security threats)
  - Yellow: Large packets (unusual traffic)
  - Blue: External connections
  - Green: Normal traffic

### Exporting Data

1. Click the "Download Logs as CSV" button
2. The current filtered view will be exported as a CSV file with a timestamp

## API Endpoints

The backend provides several REST endpoints:

- `GET /get_logs` - Retrieve logs with optional filtering by date range and event type
- `POST /clear_logs` - Clear all stored logs
- Socket.IO events for real-time updates:
  - `connect` - Client connection event
  - `start_capture` - Start packet capture
  - `stop_capture` - Stop packet capture
  - `new_log` - Emitted when new network events are detected

## Troubleshooting

### Common Issues

1. **Permission Denied**
   - Ensure you're running the backend with administrator privileges
   - On Linux/macOS, use `sudo python backend/packet_sniffer.py`
   - On Windows, run the command prompt as Administrator

2. **Port Conflicts**
   - If ports 5000 or 8000 are in use, check for other applications
   - For port 5000: `netstat -ano | findstr 5000` (Windows) or `lsof -i :5000` (Linux/macOS)
   - For port 8000: `netstat -ano | findstr 8000` (Windows) or `lsof -i :8000` (Linux/macOS)

3. **No Events Showing**
   - Verify the backend is running (check for "🛡️ Network monitoring ready" message)
   - Check browser console for WebSocket connection errors
   - Ensure you've clicked "Start Capture" on the dashboard

4. **Database Issues**
   - The SQLite database is stored in `backend/instance/network_logs.db`
   - If corrupted, it can be safely deleted (a new one will be created)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Scapy](https://scapy.net/) for network packet manipulation
- [Flask](https://flask.palletsprojects.com/) for the backend web framework
- [Vue.js](https://vuejs.org/) for the frontend framework
- [Socket.IO](https://socket.io/) for real-time communication
- [SQLAlchemy](https://www.sqlalchemy.org/) for database ORM
