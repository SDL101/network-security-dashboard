# Network Security Monitoring Dashboard

NOTE: This project is under development and some features I've listed below are not functional yet.

A real-time network traffic analysis tool that gives you instant visibility into network events, security alerts, and connection details through an interactive web interface. This dashboard captures and analyzes network packets, detecting potential security threats and unusual network behavior.

## Table of Contents

1. Overview
2. Project Structure
3. Key Features
4. System Requirements
5. Installation
6. Running the Application
7. Usage Guide
8. Code Examples
9. Troubleshooting
10. Contributing
11. License
12. Support

## Overview

This project is designed to monitor network traffic in real time. It does the following:

- **Captures network packets:** Constantly listens for network traffic.
- **Analyzes traffic:** Detects potential security threats.
- **Displays data interactively:** Uses a web interface to show real-time events, statistics, and alerts.

## Project Structure

A quick look at the folder layout shows how the project is organized:

```
network-security-dashboard/
├── backend/
│   ├── packet_sniffer.py     # Captures packets, analyzes data, and runs the WebSocket server
│   ├── app.py                # Contains database models and REST API endpoints
│   └── requirements.txt      # Lists all Python package dependencies
├── frontend/
│   ├── index.html            # The main HTML page for the dashboard
│   ├── styles.css            # Styling rules for the dashboard
│   ├── script.js             # Contains frontend logic and real-time update functions
│   └── package.json          # Lists Node.js dependencies for frontend development
└── README.md                 # This documentation file
```

## Key Features

- **Real-time monitoring:** Get live updates on network traffic.
- **Automatic threat detection:** Alerts you when unusual activity is detected.
- **Interactive filtering and search:** Easily find the information you need.
- **Data export:** Save logs as CSV files for further analysis.
- **Visual statistics:** Graphical representation of network events.
- **Color-coded alerts:** Quickly distinguish between types of network events.

## System Requirements

### Operating Systems

- Windows 10+
- macOS 10.15+
- Linux

### Hardware

- **RAM:** Minimum 4GB
- **Storage:** At least 1GB free space

### Software Dependencies

1. **Python 3.8+**
   - [Download Python](https://www.python.org/downloads/)
   - **Purpose:** Runs the backend packet capture and analysis.
2. **Node.js (LTS)**
   - [Download Node.js](https://nodejs.org/)
   - **Purpose:** Runs the frontend development server.
   - **Note:** Minimum version 14.x.
3. **Git**
   - [Download Git](https://git-scm.com/)
   - **Purpose:** For version control and downloading the project repository.

## Installation

### Step 1: Clone the Repository

Open your terminal and run:

```sh
git clone https://github.com/SDL101/network-security-dashboard.git
cd network-security-dashboard
```

**Why this step?**  
This downloads the project to your local machine so you can start working with it.

### Step 2: Setup the Backend

Create and activate a virtual environment, then install dependencies:

```sh
# Create virtual environment
python -m venv venv

# Activate virtual environment
# For Windows:
venv\Scripts\activate
# For macOS/Linux:
source venv/bin/activate

# Install required Python packages
pip install -r backend/requirements.txt
```

**Why this step?**  
Isolating dependencies in a virtual environment avoids conflicts with other projects.

### Step 3: Setup the Frontend

Navigate to the frontend directory and install Node.js packages:

```sh
cd frontend
npm install
```

**Why this step?**  
This installs all required packages to run the frontend development server.

## Running the Application

### 1. Start the Backend Server

Make sure your virtual environment is active, then run:

```sh
sudo python backend/packet_sniffer.py
```

**Why this step?**  
This gives admin rights and starts the packet capture and analysis engine that monitors network traffic.

### 2. Start the Frontend Development Server

In a new terminal, start the frontend:

```sh
cd frontend
npm run dev
```

**Why this step?**  
This serves the interactive dashboard on your browser.

**Access the Dashboard:**  
You should automatically be brought here when you run 'npm start', but if not open your browser and go to `http://localhost:8000`.

## Usage Guide

### Basic Operations

1. **Start Monitoring:**
   - Click the “Start Capture” button on the dashboard.
   - **Note:** You may need administrator privileges.
   - The dashboard will begin displaying real-time network statistics.
2. **View and Filter Events:**
   - Use dropdown menus and stat boxes to filter events by type.
   - Search using parameters like IP address, time range, or severity level.
3. **Export Data:**
   - Click “Export Logs as CSV” to save the current view.
   - Files are saved with a timestamp for easy identification.

## Code Examples

### Event Detection Logic (Backend)

Located in `backend/packet_sniffer.py`, this snippet shows how network packets are captured and processed:

```python
def start_sniffing():
    print("🛡️  Network monitoring ready...")
    try:
        sniff(filter="ip", prn=detect_threat, store=False)
    except Exception as e:
        print(f"Error in packet sniffing: {e}")

def signal_handler(sig, frame):
    print("Shutting down...")
    global is_capturing
    is_capturing = False
    sys.exit(0)
```

### Real-time Updates (Frontend)

Located in `frontend/script.js`, this snippet shows how new log messages are handled:

```javascript
activeSocket.on("new_log", function (data) {
  if (!isCapturing || !data) return;
  if (isCapturePaused) {
    queuedLogs.push(data.log);
  } else {
    if (data.log) addLogEntry(data.log);
    if (data.stats) updateStats(data.stats);
  }
});
```

## Troubleshooting

### Common Issues and How to Solve Them

1. **Permission Errors:**
   - **Windows:** Run the terminal as Administrator.
   - **Linux/macOS:** Use `sudo python backend/packet_sniffer.py` if needed.
2. **Port Conflicts:**
   - Backend (port 5000): Check with `netstat -ano | findstr 5000`
   - Frontend (port 8000): Check with `netstat -ano | findstr 8000`
3. **Connection Issues:**
   - Verify that the backend is running (look for the 🛡️ indicator).
   - Check the browser console for errors.
   - Ensure firewall settings allow the connections.

## Contributing

If you’d like to contribute, please read our **Contributing Guidelines** and **Code of Conduct** before submitting a pull request.

## License

This project is licensed under the **MIT License**. See the `LICENSE` file for details.

## Support

For any issues or questions, please refer to our support channels or open an issue on GitHub.
