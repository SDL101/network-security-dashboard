# Network Security Dashboard

[![Development Status](https://img.shields.io/badge/status-ready%20for%20production-green)](https://github.com/SDL101/network-security-dashboard)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Last Commit](https://img.shields.io/github/last-commit/SDL101/network-security-dashboard)](https://github.com/SDL101/network-security-dashboard/commits/main)
[![Open Issues](https://img.shields.io/github/issues/SDL101/network-security-dashboard)](https://github.com/SDL101/network-security-dashboard/issues)

A comprehensive real-time network traffic analysis tool that provides instant visibility into network events, security threats, and connection patterns through an interactive web dashboard. Monitor your network traffic, detect potential security risks, and analyze connection patterns all in one place.

## ✨ New Features
- **📚 Built-in Documentation**: Complete usage guide and technical reference accessible within the app
- **🔄 Enhanced Reliability**: Auto-reconnection and robust error handling
- **💾 Session Management**: Save and restore capture sessions with custom titles
- **🎨 Professional UI**: Modern, responsive design with dark/light mode support

Check out a quick video demo here:

https://github.com/user-attachments/assets/4cfefe09-ed3a-4f96-9dbf-3d78cafaa586


<div style="display: flex; justify-content: space-between; margin: 20px 0;">
  <img src="https://github.com/user-attachments/assets/23301a0f-b56d-4175-954e-0ec7fc8c0fc6" style="width:45%;">
  <img src="https://github.com/user-attachments/assets/92c742e6-4531-43f0-be73-599aafc25c4a" style="width:45%;">
</div>


## Core Features

### 🔍 **Real-time Network Monitoring**
- Live packet capture and analysis using Scapy
- Automatic protocol detection (HTTP/HTTPS, DNS, SSH, FTP, etc.)
- Real-time statistics and threat detection
- Color-coded event categorization

### 🛡️ **Security Threat Detection**
- **Port Scan Detection**: Identifies SYN packets indicating reconnaissance
- **Large Packet Analysis**: Flags unusually large UDP packets
- **External Connection Monitoring**: Tracks traffic to non-private IPs
- **Severity Classification**: High/Medium/Low risk categorization

### 📊 **Interactive Dashboard** 
- **Live Capture Tab**: Real-time monitoring with advanced filtering
- **Archive Tab**: Session management and historical analysis
- **Documentation Tab**: Built-in comprehensive usage guide
- Advanced filtering by event type, severity, protocol, IP, and ports
- Bidirectional stream following for connection analysis

### 💾 **Data Management**
- SQLite database for persistent storage
- Session saving with custom titles
- CSV export functionality
- Automatic pagination for large datasets
- Memory management with configurable limits

### 🎨 **Modern UI/UX**
- Responsive design for desktop and mobile
- Dark/light theme toggle
- Professional color-coding and typography
- Auto-reconnection with connection status indicators

## Architecture

```
network-security-dashboard/
├── README.md                   # Project documentation
├── LICENSE                     # MIT License
├── .gitignore                  # Git ignore rules
├── start_backend.sh            # Backend setup and launch script
├── start_frontend.sh           # Frontend setup and launch script
├── backend/                    # Backend server and network monitoring
│   ├── database.py             # Database models and SQLAlchemy setup
│   ├── packet_sniffer.py       # Core packet capture and analysis logic
│   ├── requirements.txt        # Python dependencies
│   └── venv/                   # Python virtual environment (created by script)
└── frontend/                   # Vue.js frontend application
    ├── index.html              # Main HTML entry point
    ├── package.json            # Frontend dependencies and scripts
    ├── vite.config.js          # Vite build configuration
    ├── node_modules/           # Node.js dependencies (created by script)
    └── src/                    # Source code directory
        ├── App.vue             # Root Vue component with tab navigation
        ├── main.js             # Vue application entry point
        ├── assets/
        │   └── styles.css      # Global CSS styles
        ├── components/         # Vue components
        │   ├── CaptureControls.vue    # Start/stop capture controls
        │   ├── ConnectionStatus.vue   # Network connection status
        │   ├── FilterPanel.vue        # Advanced log filtering
        │   ├── LogsTable.vue          # Real-time log display
        │   ├── StatPanel.vue          # Network statistics
        │   └── ThemeToggle.vue        # Dark/light mode toggle
        └── stores/
            └── networkStore.js # Pinia state management
```

## System Requirements

### Hardware
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 1GB free space for dependencies and logs
- **Network**: Active network interface for packet capture

### Software Dependencies
- **Operating System**: macOS, Linux, or Windows with WSL
- **Python**: 3.8 or higher with pip
- **Node.js**: 14.0 or higher with npm
- **Permissions**: Administrator/root access for packet capture

### Network Requirements
- Port 5000 available for backend API
- Port 8000 available for frontend development server
- Network interface accessible for packet capture

## Quick Start

### Prerequisites
- **Python 3.8+** - For backend packet capture and analysis
- **Node.js 14+** - For frontend development and build
- **Administrator/Root privileges** - Required for packet sniffing
- **2 terminal windows** - One for backend, one for frontend

### Installation & Setup

1. **Clone the repository:**
```bash
git clone https://github.com/SDL101/network-security-dashboard.git
cd network-security-dashboard
```

2. **Start the backend** (First Terminal):
```bash
./start_backend.sh
```
*This script will automatically set up the Python virtual environment, install dependencies, and start the backend server with sudo privileges.*

3. **Start the frontend** (Second Terminal):
```bash
./start_frontend.sh
```
*This script will automatically install Node.js dependencies and start the development server.*

4. **Access the application:**
   - Open your browser to **http://localhost:8000**
   - The backend API runs on http://localhost:5000

### Verification
✅ Backend should display: "🛡️ Network monitoring ready"  
✅ Frontend should open automatically in your browser  
✅ You should see the dashboard with connection status, capture controls, and documentation tab

### What the Setup Scripts Do

- **`start_backend.sh`**: Creates Python virtual environment, installs dependencies, starts the packet capture server
- **`start_frontend.sh`**: Installs Node.js dependencies, starts the Vue.js development server

### Troubleshooting

**Port conflicts:**
```bash
# Kill processes on port 5000 (backend)
lsof -ti:5000 | xargs kill -9

# Kill processes on port 8000 (frontend)  
lsof -ti:8000 | xargs kill -9
```

**Permission issues:**
- Ensure you run `./start_backend.sh` (it handles sudo automatically)
- On macOS, disable AirPlay Receiver if port 5000 conflicts occur

**Dependencies:**
- Make sure Python 3.8+ and Node.js 14+ are installed
- Scripts will handle all other dependency installation

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

## Technology Stack

### Frontend
- **Vue.js 3** - Progressive JavaScript framework with Composition API
- **Pinia** - State management with reactive data flow
- **Vite** - Fast build tool and development server
- **Socket.IO Client** - Real-time bidirectional communication

### Backend  
- **Python Flask** - Lightweight web framework for REST APIs
- **Scapy** - Powerful packet manipulation and network analysis
- **SQLAlchemy** - SQL toolkit and Object-Relational Mapping
- **Flask-SocketIO** - WebSocket support with automatic fallbacks
- **SQLite** - Embedded database for session persistence

## API Reference

### REST Endpoints
- `GET /get_logs` - Retrieve current session logs and statistics
- `POST /clear_logs` - Clear all logs from current session
- `POST /save_session` - Save current logs as named session
- `GET /list_sessions` - List all saved capture sessions
- `GET /get_session_logs/<id>` - Retrieve logs from specific session
- `DELETE /delete_session/<id>` - Delete a saved session

### Socket.IO Events
**Client → Server:**
- `start_capture` - Begin network packet monitoring
- `stop_capture` - Stop packet monitoring

**Server → Client:**
- `new_log` - Real-time network event with statistics
- `capture_status` - Current capture state and system stats
- `capture_error` - Error notifications and reconnection info

## Advanced Usage

### Features Overview

- **📊 Live Capture Tab**: Real-time network monitoring with filtering and analysis
- **📁 Archive Tab**: Save and restore capture sessions for later analysis  
- **📚 Documentation Tab**: Complete usage guide and technical documentation built into the app
- **🎨 Theme Toggle**: Switch between light and dark modes
- **🔄 Auto-Reconnection**: Automatic reconnection when backend connectivity is lost

### Stream Following

Click on any log entry to automatically filter and follow the conversation between two network endpoints. This is useful for:
- Analyzing specific connections
- Following data flows
- Investigating suspicious activity

### Session Management

Save your capture sessions with custom titles for later analysis:
1. Stop capture when you have interesting data
2. Click "Save Logs" 
3. Choose to save filtered logs or all logs
4. Access saved sessions from the Archive tab

## Development

### API Documentation
Visit the **Documentation tab** in the application for complete API reference including REST endpoints and Socket.IO events.

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Additional Notes

### Security Considerations
- Requires administrator privileges for packet capture
- Only captures packets on the local machine's network interfaces
- No data is transmitted outside your local network

### Performance
- Automatically limits log entries to prevent memory issues
- Efficient real-time updates using Socket.IO
- Pagination for large datasets

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Third-Party Libraries
- **Vue.js** - MIT License
- **Flask** - BSD-3-Clause License  
- **Scapy** - GPL v2 License
- **Socket.IO** - MIT License
- **SQLAlchemy** - MIT License

## Credits

**Developer**: Scott Lindsay  
**GitHub**: [@SDL101](https://github.com/SDL101)  
**Project**: Network Security Dashboard

Built with ❤️ for network security professionals and enthusiasts.
