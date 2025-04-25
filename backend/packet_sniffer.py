# === Imports: ===
from scapy.all import sniff, IP, TCP, UDP, DNS, DNSQR  # Packet sniffing and protocol layers for network analysis
from flask_socketio import SocketIO  # Real-time communication using SocketIO
from flask import Flask, jsonify, request  # Core Flask components for web server and API endpoints
from flask_cors import CORS  # Enable CORS to allow cross-origin requests from clients
import datetime  # For date and time operations
import ipaddress  # To verify and manipulate IP addresses
import time  # Provides time-related functions for tracking uptime and timestamps
import threading  # To enable multi-threaded operations
import signal  # Handle OS-level signals for graceful shutdown
import sys  # System-specific parameters and functions
from database import db, NetworkLog, CaptureSession
from flask_sqlalchemy import SQLAlchemy  
import json

# === App Setup: Initialize Flask app, enable CORS, and configure SocketIO ===
app = Flask(__name__)  # Create the Flask application instance
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///network_logs.db'  # Configure database URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False  # Disable tracking modifications
db.init_app(app)  # Initialize SQLAlchemy with the Flask app
CORS(app)  # Allow requests from different origins for the web app
socketio = SocketIO(
    app,
    cors_allowed_origins="*",  # Allow all origins for SocketIO connections
    ping_timeout=60,          # Set the ping timeout interval (in seconds)
    ping_interval=25,         # Set the ping interval (in seconds)
    async_mode='threading'    # Use threading for asynchronous operations
)

# === Global Vars: Initialize capture flag and statistics dictionary ===
is_capturing = False

# Single source of truth for stats initialization
def get_initial_stats():
    return {
        "packets_analyzed": 0,
        "start_time": time.time(),
        "threats_detected": 0,
        "last_scan_time": None,
        "active_ips": set(),
        "logs": []
    }

stats = get_initial_stats()

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
    # Don't reset stats, just emit curr vals
    socketio.emit('capture_status', {
        'status': 'stopped',
        'stats': format_stats()  # Send curr stats instead of zeroed stats
    })
    print("Capture stopped")

# === Threat Detection: Analyze packets to detect potential network threats ===
def detect_threat(packet):
    # Only process packets if capture is active
    if not is_capturing:
        return

    # Only process packets that have an IP layer, else return
    if not packet.haslayer(IP):
        return

    try:
        # Update statistics for every processed packet
        stats["packets_analyzed"] += 1
        stats["last_scan_time"] = datetime.datetime.now()
        stats["active_ips"].add(packet[IP].src) 
        stats["active_ips"].add(packet[IP].dst)

        # Protocol detection
        protocol = "Other"
        dns_details = None
        if packet.haslayer(TCP):
            sport = packet[TCP].sport
            dport = packet[TCP].dport
            
            # Some ommon web ports (HTTP/HTTPS). Work in prog - will keep adding to this 
            if dport == 80 or sport == 80:
                protocol = "HTTP"
            elif dport == 443 or sport == 443:
                protocol = "HTTPS"
            # Email ports
            elif dport == 25 or sport == 25:
                protocol = "SMTP"
            elif dport == 110 or sport == 110:
                protocol = "POP3"
            elif dport == 143 or sport == 143:
                protocol = "IMAP"
            # File transfer and remote access
            elif dport == 22 or sport == 22:
                protocol = "SSH"
            elif dport == 21 or sport == 21:
                protocol = "FTP"
            elif dport == 3389 or sport == 3389:
                protocol = "RDP"
            # Database ports
            elif dport == 3306 or sport == 3306:
                protocol = "MySQL"
            elif dport == 5432 or sport == 5432:
                protocol = "PostgreSQL"
            elif dport == 1433 or sport == 1433:
                protocol = "MSSQL"
            # Other common services
            elif dport == 8080 or sport == 8080:
                protocol = "HTTP-ALT"
            else:
                protocol = f"TCP ({dport})"
            
        elif packet.haslayer(UDP):
            sport = packet[UDP].sport
            dport = packet[UDP].dport
            # Identify common UDP services
            if dport == 53 or sport == 53:
                protocol = "DNS"
                # Try to extract DNS query name
                if packet.haslayer(DNS) and packet.haslayer(DNSQR):
                    qname = packet[DNSQR].qname.decode(errors='ignore').rstrip('.')
                    dns_details = f"Queried domain: {qname}" if qname else "N/A"
                else:
                    dns_details = "N/A"
            elif dport == 67 or dport == 68:
                protocol = "DHCP"
            else:
                protocol = f"UDP ({dport})"
        elif packet.haslayer('ICMP'):
            protocol = "ICMP"

        # Create a default log entry for normal traffic with enhanced protocol info
        log_entry = {
            "timestamp": str(datetime.datetime.now()),
            "source_ip": packet[IP].src,
            "destination_ip": packet[IP].dst,
            "protocol": protocol,
            "event_type": "normal_traffic",
            "details": dns_details if dns_details is not None else "Normal network traffic",
            "severity": "low"
        }

        # --- Detect Port Scanning ---
        # Check for a TCP packet with SYN flag (flag value 2), which may indicate port scanning
        if packet.haslayer(TCP) and packet[TCP].flags == 2:
            stats["threats_detected"] += 1
            log_entry.update({
                "event_type": "network_scan",
                "details": f"Port scan - SYN packet to port {packet[TCP].dport}",
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
                "details": f"External conn to {log_entry['destination_ip']}",
                "severity": "medium"
            })

        # Append the log entry to the logs list
        stats["logs"].append(log_entry)
        # Limit the logs list to the most recent 1000 entries to avoid memory overflow
        if len(stats["logs"]) > 1000:
            stats["logs"].pop(0)

        # Add this right after creating the log_entry
        socketio.emit("new_log", {
            "log": log_entry,
            "stats": format_stats()
        })

        # Add this to save logs to database (around line 198)
        with app.app_context():
            network_log = NetworkLog(
                timestamp=log_entry["timestamp"],
                source_ip=log_entry["source_ip"],
                destination_ip=log_entry["destination_ip"],
                event_type=log_entry["event_type"],
                details=log_entry["details"]
            )
            db.session.add(network_log)
            db.session.commit()

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
    stats = get_initial_stats()

# === API Endpoint: Clear logs and reset all statistics via a POST request ===
@app.route('/clear_logs', methods=['POST'])
def clear_logs():
    reset_stats()  # Use existing function instead of duplicating logic
    return jsonify({"status": "success", "message": "Logs cleared successfully"})

# === API Endpoint: Retrieve current logs and statistics via a GET request ===
@app.route('/get_logs')
def get_logs():
    # Return the logs and formatted stats as a JSON response
    return jsonify({
        "logs": stats.get("logs", []),
        "stats": format_stats()
    })

@app.route('/save_session', methods=['POST'])
def save_session():
    data = request.get_json()
    title = data.get('title')
    logs = data.get('logs')
    timestamp = data.get('timestamp')
    if not title or not logs or not timestamp:
        return jsonify({'status': 'error', 'message': 'Missing required fields'}), 400
    session = CaptureSession(
        title=title,
        timestamp=timestamp,
        logs=json.dumps(logs)
    )
    db.session.add(session)
    db.session.commit()
    return jsonify({'status': 'success', 'id': session.id})

@app.route('/list_sessions')
def list_sessions():
    sessions = CaptureSession.query.order_by(CaptureSession.id.desc()).all()
    result = []
    for s in sessions:
        try:
            logs = json.loads(s.logs)
            log_count = len(logs)
        except Exception:
            log_count = 0
        result.append({
            'id': s.id,
            'title': s.title,
            'timestamp': s.timestamp,
            'log_count': log_count
        })
    return jsonify(result)

@app.route('/get_session_logs/<int:session_id>')
def get_session_logs(session_id):
    session = CaptureSession.query.get(session_id)
    if not session:
        return jsonify({'status': 'error', 'message': 'Session not found'}), 404
    try:
        logs = json.loads(session.logs)
    except Exception:
        logs = []
    return jsonify({'logs': logs, 'title': session.title, 'timestamp': session.timestamp})

@app.route('/delete_session/<int:session_id>', methods=['DELETE'])
def delete_session(session_id):
    session = CaptureSession.query.get(session_id)
    if not session:
        return jsonify({'status': 'error', 'message': 'Session not found'}), 404
    db.session.delete(session)
    db.session.commit()
    return jsonify({'status': 'success'})

# === Main: Set up signal handling, initiate background packet sniffing, and run the server ===
if __name__ == "__main__":
    # Register the signal handler for graceful shutdown on SIGINT (Ctrl+C)
    signal.signal(signal.SIGINT, signal_handler)
    print("Starting server on port 5000...")
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
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
