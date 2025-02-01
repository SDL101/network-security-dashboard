# === Imports: ===
from scapy.all import sniff, IP, TCP, UDP  # Packet sniffing and protocol layers for network analysis
from flask_socketio import SocketIO  # Real-time communication using SocketIO
from flask import Flask, jsonify, request  # Core Flask components for web server and API endpoints
from flask_cors import CORS  # Enable CORS to allow cross-origin requests from clients
import datetime  # For date and time operations
import ipaddress  # To verify and manipulate IP addresses
import time  # Provides time-related functions for tracking uptime and timestamps
import threading  # To enable multi-threaded operations
import signal  # Handle OS-level signals for graceful shutdown
import sys  # System-specific parameters and functions

# === App Setup: Initialize Flask app, enable CORS, and configure SocketIO ===
app = Flask(__name__)  # Create the Flask application instance
CORS(app)  # Allow requests from different origins for the web app
socketio = SocketIO(
    app,
    cors_allowed_origins="*",  # Allow all origins for SocketIO connections
    ping_timeout=60,          # Set the ping timeout interval (in seconds)
    ping_interval=25,         # Set the ping interval (in seconds)
    async_mode='threading'    # Use threading for asynchronous operations
)

# === Global Vars: Initialize capture flag and statistics dictionary ===
is_capturing = False  # Flag to indicate whether packet capture is active
stats = {
    "packets_analyzed": 0,  # Total number of packets analyzed
    "start_time": time.time(),  # Timestamp when the monitoring started
    "threats_detected": 0,  # Total number of threats detected during monitoring
    "last_scan_time": None,  # Timestamp of the last packet scan
    "active_ips": set(),  # Set of unique IP addresses encountered
    "logs": []  # List to store log entries for each detected event
}

# === SocketIO Event Handlers: Manage client connections and capture commands ===
@socketio.on('connect')
def handle_connect():
    # Called when a new client connects via SocketIO
    print("Client connected")
    return True

@socketio.on('disconnect')
def handle_disconnect():
    # Called when a client disconnects
    print("Client disconnected")

@socketio.on('start_capture')
def handle_start_capture():
    global is_capturing
    print("Start capture requested")
    reset_stats()  # Reset all statistics before starting a new capture session
    is_capturing = True  # Set capture flag to active
    # Inform the client that capture has started along with initial stats
    socketio.emit('capture_status', {
        'status': 'started',
        'stats': {
            'packets_analyzed': 0,
            'threats_detected': 0,
            'active_ips': 0,
            'scan_status': 'Normal',
            'uptime_seconds': 0
        }
    })
    print("Capture started with reset stats")

@socketio.on('stop_capture')
def handle_stop_capture():
    global is_capturing
    print("Stop capture requested")
    is_capturing = False  # Deactivate capture flag
    reset_stats()  # Reset stats when stopping capture to clear previous data
    # Inform the client that capture has stopped along with cleared stats
    socketio.emit('capture_status', {
        'status': 'stopped',
        'stats': {
            'packets_analyzed': 0,
            'threats_detected': 0,
            'active_ips': 0,
            'scan_status': 'Normal',
            'uptime_seconds': 0
        }
    })
    print("Capture stopped with reset stats")

# === Threat Detection: Analyze packets to detect potential network threats ===
def detect_threat(packet):
    # Only process packets if capture is active
    if not is_capturing:
        return

    # Only process packets that have an IP layer
    if not packet.haslayer(IP):
        return

    try:
        # Update statistics for every processed packet
        stats["packets_analyzed"] += 1
        stats["last_scan_time"] = datetime.datetime.now()
        # Track both source and destination IP addresses as active
        stats["active_ips"].add(packet[IP].src)
        stats["active_ips"].add(packet[IP].dst)

        # Create a default log entry for normal traffic
        log_entry = {
            "timestamp": str(datetime.datetime.now()),
            "source_ip": packet[IP].src,
            "destination_ip": packet[IP].dst,
            "event_type": "normal_traffic",
            "details": "Normal network traffic",
            "severity": "low"
        }

        # --- Detect Port Scanning ---
        # Check for a TCP packet with SYN flag (flag value 2), which may indicate port scanning
        if packet.haslayer(TCP) and packet[TCP].flags == 2:
            stats["threats_detected"] += 1
            log_entry.update({
                "event_type": "network_scan",
                "details": f"Port scanning detected - SYN packet to port {packet[TCP].dport}",
                "severity": "high"
            })
        
        # --- Detect Large Packets ---
        # For UDP packets, a size greater than 1400 bytes is considered unusual
        elif packet.haslayer(UDP) and len(packet) > 1400:
            stats["threats_detected"] += 1
            log_entry.update({
                "event_type": "large_packet",
                "details": f"Unusual packet size: {len(packet)} bytes",
                "severity": "medium"
            })

        # --- Detect External Connections ---
        # Check if the destination IP is external (non-private)
        elif not is_private_ip(log_entry["destination_ip"]):
            log_entry.update({
                "event_type": "external_connection",
                "details": f"External connection to {log_entry['destination_ip']}",
                "severity": "medium"
            })

        # Append the log entry to the logs list
        stats["logs"].append(log_entry)
        # Limit the logs list to the most recent 1000 entries to avoid memory overflow
        if len(stats["logs"]) > 1000:
            stats["logs"].pop(0)

        # Emit the new log and updated stats to connected clients in real-time
        socketio.emit("new_log", {
            "log": log_entry,
            "stats": format_stats()
        })
        print(f"Emitted log: {log_entry['event_type']}", flush=True)

    except Exception as e:
        # Log any exceptions encountered during threat detection
        print(f"Error in detect_threat: {e}", flush=True)

# === Packet Sniffing: Capture network packets continuously for analysis ===
def start_sniffing():
    print("🛡️  Network monitoring ready...")
    try:
        # Start sniffing packets that match the "ip" filter and process them with detect_threat
        sniff(filter="ip", prn=detect_threat, store=False)
    except Exception as e:
        # Log any errors that occur during packet sniffing
        print(f"Error in packet sniffing: {e}")

# === Signal Handling: Gracefully shut down the server on receiving interrupt signals ===
def signal_handler(sig, frame):
    print("Shutting down...")
    global is_capturing
    is_capturing = False  # Ensure packet capture is stopped
    sys.exit(0)  # Exit the application

# === IP Check: Determine if a given IP address is private ===
def is_private_ip(ip):
    try:
        # Returns True if the IP is private (e.g., 192.168.x.x), else False
        return ipaddress.ip_address(ip).is_private
    except:
        # Return False if the IP address is invalid or an error occurs
        return False

# === Stats Formatting: Prepare current statistics in a structured format ===
def format_stats():
    current_time = time.time()
    uptime = int(current_time - stats["start_time"])  # Calculate uptime in seconds
    return {
        "packets_analyzed": stats.get("packets_analyzed", 0),
        "threats_detected": stats.get("threats_detected", 0),
        "active_ips": len(stats.get("active_ips", set())),
        "scan_status": "Normal",  # Static status; can be updated to reflect real-time analysis if needed
        "uptime_seconds": uptime
    }

# === Stats Reset: Reinitialize tracking statistics to their default states ===
def reset_stats():
    global stats
    stats["packets_analyzed"] = 0
    stats["threats_detected"] = 0
    stats["start_time"] = time.time()
    stats["last_scan_time"] = None
    stats["active_ips"] = set()
    stats["logs"] = []

# === API Endpoint: Clear logs and reset all statistics via a POST request ===
@app.route('/clear_logs', methods=['POST'])
def clear_logs():
    global stats
    # Reset stats and logs to default values
    stats = {
        "packets_analyzed": 0,
        "start_time": time.time(),
        "threats_detected": 0,
        "last_scan_time": None,
        "active_ips": set(),
        "logs": []  # Clear the logs list
    }
    # Respond with a success message
    return jsonify({"status": "success", "message": "Logs cleared successfully"})

# === API Endpoint: Retrieve current logs and statistics via a GET request ===
@app.route('/get_logs')
def get_logs():
    # Return the logs and formatted stats as a JSON response
    return jsonify({
        "logs": stats.get("logs", []),
        "stats": format_stats()
    })

# === Main: Set up signal handling, initiate background packet sniffing, and run the server ===
if __name__ == "__main__":
    # Register the signal handler for graceful shutdown on SIGINT (Ctrl+C)
    signal.signal(signal.SIGINT, signal_handler)
    print("Starting server on port 5000...")
    # Start the packet sniffing process in a background thread
    socketio.start_background_task(start_sniffing)
    # Run the SocketIO server with the specified host, port, and configuration
    socketio.run(
        app,
        host="0.0.0.0",
        port=5000,
        debug=True,
        use_reloader=False  # Disable reloader to prevent multiple instances during development
    )
